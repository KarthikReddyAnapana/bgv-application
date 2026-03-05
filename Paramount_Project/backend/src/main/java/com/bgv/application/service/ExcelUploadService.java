package com.bgv.application.service;

import com.bgv.application.entity.BgvExcelUploadCell;
import com.bgv.application.entity.BgvExcelUploadRecord;
import com.bgv.application.repository.BgvExcelUploadCellRepository;
import com.bgv.application.repository.BgvExcelUploadRecordRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.DateUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ExcelUploadService {

    @Autowired
    private BgvExcelUploadRecordRepository repository;

    @Autowired
    private BgvExcelUploadCellRepository cellRepository;

    public static class UploadResult {
        public int imported;
        public int skipped;
        public List<String> warnings = new ArrayList<>();
    }

    public UploadResult importExcel(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Excel file is required");
        }

        String filename = file.getOriginalFilename() == null ? "upload.xlsx" : file.getOriginalFilename();
        String lower = filename.toLowerCase(Locale.ROOT);
        if (!(lower.endsWith(".xlsx") || lower.endsWith(".xls"))) {
            throw new IllegalArgumentException("Only .xlsx or .xls files are supported");
        }

        UploadResult result = new UploadResult();

        final String uploadBatchId = UUID.randomUUID().toString();

        // Used for an H2-only convenience VIEW showing dynamic columns for the latest upload.
        List<String> batchHeaders = List.of();

        try (InputStream in = file.getInputStream(); Workbook workbook = WorkbookFactory.create(in)) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null) {
                throw new IllegalArgumentException("Excel sheet not found");
            }

            Iterator<Row> rowIt = sheet.rowIterator();
            if (!rowIt.hasNext()) {
                result.warnings.add("No rows found in sheet");
                return result;
            }

            Row headerRow = rowIt.next();
            HeaderInfo headerInfo = buildHeaderInfo(headerRow);
            if (headerInfo.headersInOrder.isEmpty()) {
                throw new IllegalArgumentException("Header row is empty");
            }

            batchHeaders = headerInfo.headersInOrder;

            // Best-effort validation: warn if expected columns are missing (mapping remains tolerant)
            if (!hasAnyHeader(headerInfo.normalizedToIndex, "psnumber", "ps_number", "ps number", "ps no", "ps")) {
                result.warnings.add("Missing PS Number column (expected header like 'PS Number')");
            }
            if (!hasAnyHeader(headerInfo.normalizedToIndex, "name", "resource name", "resource_name", "employee name")) {
                result.warnings.add("Missing Name/Resource Name column (expected header like 'Name')");
            }
            if (!hasAnyHeader(headerInfo.normalizedToIndex, "status")) {
                result.warnings.add("Missing Status column (expected header like 'Status')");
            }
            if (!hasAnyHeader(headerInfo.normalizedToIndex, "by", "initiated by", "requested by")) {
                result.warnings.add("Missing By/Initiated By column (expected header like 'By')");
            }

            int rowNumber = 1; // 1-based for users
            while (rowIt.hasNext()) {
                Row row = rowIt.next();
                rowNumber++;

                if (isRowEmpty(row)) {
                    result.skipped++;
                    continue;
                }

                BgvExcelUploadRecord rec = new BgvExcelUploadRecord();
                rec.setSourceFilename(filename);
                rec.setSourceRowNumber(rowNumber);
                rec.setUploadedAt(Instant.now().getEpochSecond());
                rec.setUploadBatchId(uploadBatchId);

                // Full row capture (exact headers + values, in order)
                List<String> valuesInOrder = buildRowValues(row, headerInfo.headersInOrder, headerInfo.columnIndexes);
                // RAW JSON fields intentionally not stored; we persist fully normalized cells instead.

                // Extract common fields (header names are flexible)
                // NOTE: This uploader is used for multiple Excel templates (BGV + yearly dashboard).
                // Keep this mapping tolerant and alias-rich so structured columns get populated.
                rec.setPsNumber(getString(row, headerInfo.normalizedToIndex,
                    "psnumber", "ps_number", "ps number", "ps no", "ps no.", "ps",
                    "bgv requested by-ps no", "bgv requested by-ps no.", "bgv requested by ps no", "bgv requested by ps no."));

                // In some sheets, "By" represents the requester/initiator.
                rec.setRequestedByName(getString(row, headerInfo.normalizedToIndex,
                    "requestedbyname", "requested_by_name", "requested by", "by", "created by", "submitted by",
                    "bgv requested by-name", "bgv requested by-name ", "bgv requested by name"));

                // Candidate ID may not exist in dashboard sheets; "Project Id" is a common substitute.
                rec.setCandidateId(getString(row, headerInfo.normalizedToIndex,
                    "candidateid", "candidate_id", "candidate id", "rh id", "candidate id / rh id", "candidate id/rh id",
                    "projectid", "project id", "project_id"));

                rec.setResourceName(getString(row, headerInfo.normalizedToIndex,
                    "resourcename", "resource_name", "resource name", "name", "employee name"));

                rec.setResourcePsNo(getString(row, headerInfo.normalizedToIndex,
                    "resourcepsno", "resource_ps_no", "resource ps", "resource psno", "employee ps", "employee psno",
                    "resource ps.no", "resource ps. no", "resource ps no", "resource ps number"));

                // Some sheets use Grade instead of Resource Type.
                rec.setResourceType(getString(row, headerInfo.normalizedToIndex,
                    "resourcetype", "resource_type", "resource type", "grade"));

                // Many dashboards use Practice/Region naming.
                rec.setGeoRegion(getString(row, headerInfo.normalizedToIndex,
                    "georegion", "geo_region", "geo region", "geo", "region", "practice"));

                rec.setCountry(getString(row, headerInfo.normalizedToIndex,
                    "country", "location", "work location"));

                rec.setStatus(getString(row, headerInfo.normalizedToIndex,
                    "status"));

                rec.setBgvInitiatedBy(getString(row, headerInfo.normalizedToIndex,
                    "bgvinitiatedby", "bgv_initiated_by", "bgv initiated by", "initiatedby", "initiated_by", "initiated by", "by"));

                rec.setCommentsFromPmo(getString(row, headerInfo.normalizedToIndex,
                    "commentsfrompmo", "comments_from_pmo", "comments", "remarks", "comment"));

                // Some dashboards store Onsite/Offshore under "Current HR Onsite/Offshore".
                rec.setOnboardingType(getString(row, headerInfo.normalizedToIndex,
                    "onboardingtype", "onboarding_type", "onboarding type",
                    "currenthronsiteoffshore", "current hr onsite/offshore", "onsite/offshore", "onsite offshore"));

                rec.setRrNumber(getDouble(row, headerInfo.normalizedToIndex, "rrnumber", "rr_number", "rr no", "rr"));

                // Different templates use different date headers.
                LocalDate submittedOn = getLocalDate(row, headerInfo.normalizedToIndex,
                    "requestsubmittedon", "request_submitted_on", "request submitted on",
                    "submitted on", "submitted date",
                    "doj", "start date", "start_date");
                rec.setRequestSubmittedOn(submittedOn != null ? submittedOn.toString() : null);

                // Fallbacks to reduce nulls when templates use minimal columns
                if (rec.getBgvInitiatedBy() == null || rec.getBgvInitiatedBy().isBlank()) {
                    rec.setBgvInitiatedBy(rec.getRequestedByName());
                }

                repository.save(rec);

                // Persist header/value cells for dynamic H2 view + robust querying
                List<BgvExcelUploadCell> cells = new ArrayList<>(headerInfo.headersInOrder.size());
                Long uploadedAt = rec.getUploadedAt();
                for (int i = 0; i < headerInfo.headersInOrder.size(); i++) {
                    String h = headerInfo.headersInOrder.get(i);
                    String v = i < valuesInOrder.size() ? valuesInOrder.get(i) : "";
                    BgvExcelUploadCell c = new BgvExcelUploadCell();
                    c.setUploadBatchId(uploadBatchId);
                    c.setSourceRowNumber(rowNumber);
                    c.setColumnIndex(i);
                    c.setHeader(h == null ? "" : h);
                    c.setValue(v == null ? "" : v);
                    c.setUploadedAt(uploadedAt);
                    cells.add(c);
                }
                cellRepository.saveAll(cells);
                result.imported++;
            }
        }

        // Note: H2-specific view creation removed for DynamoDB migration

        return result;
    }

    // H2-specific view creation methods removed for DynamoDB migration
    // Pivot queries and dynamic views are no longer needed with NoSQL

    public List<BgvExcelUploadRecord> getByMonth(int year, int month) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        Instant start = startDate.atStartOfDay(ZoneId.of("UTC")).toInstant();
        Instant end = startDate.plusMonths(1).atStartOfDay(ZoneId.of("UTC")).toInstant();
        return repository.findByUploadedAtBetweenOrderByUploadedAtAsc(start.getEpochSecond(), end.getEpochSecond());
    }

    private ExcelTable buildExcelTableFromBatch(String uploadBatchId) {
        if (uploadBatchId == null || uploadBatchId.isBlank()) {
            return new ExcelTable(List.of(), List.of());
        }

        List<BgvExcelUploadRecord> records = repository.findByUploadBatchIdOrderBySourceRowNumberAsc(uploadBatchId);
        if (records.isEmpty()) {
            return new ExcelTable(List.of(), List.of());
        }

        List<com.bgv.application.entity.BgvExcelUploadCell> cells = cellRepository
                .findByUploadBatchIdOrderBySourceRowNumberAscColumnIndexAsc(uploadBatchId);
        if (cells.isEmpty()) {
            return new ExcelTable(List.of(), List.of());
        }

        // Build headers by column index (preserves the Excel header order)
        int maxCol = -1;
        for (var c : cells) {
            if (c.getColumnIndex() != null && c.getColumnIndex() > maxCol) maxCol = c.getColumnIndex();
        }
        if (maxCol < 0) return new ExcelTable(List.of(), List.of());

        String[] headers = new String[maxCol + 1];
        Arrays.fill(headers, "");
        for (var c : cells) {
            Integer ci = c.getColumnIndex();
            if (ci == null || ci < 0 || ci >= headers.length) continue;
            if (headers[ci] == null || headers[ci].isBlank()) {
                headers[ci] = c.getHeader() == null ? "" : c.getHeader();
            }
        }

        // Prepare rows (only for row numbers we actually have in records)
        Map<Integer, String[]> rowToValues = new LinkedHashMap<>();
        for (BgvExcelUploadRecord r : records) {
            Integer rn = r.getSourceRowNumber();
            if (rn == null) continue;
            String[] row = new String[headers.length];
            Arrays.fill(row, "");
            rowToValues.put(rn, row);
        }

        for (var c : cells) {
            Integer rn = c.getSourceRowNumber();
            Integer ci = c.getColumnIndex();
            if (rn == null || ci == null) continue;
            String[] row = rowToValues.get(rn);
            if (row == null) continue;
            if (ci < 0 || ci >= row.length) continue;
            row[ci] = c.getValue() == null ? "" : c.getValue();
        }

        List<String> outHeaders = Arrays.asList(headers);
        List<List<String>> outRows = new ArrayList<>(rowToValues.size());
        for (String[] row : rowToValues.values()) {
            outRows.add(Arrays.asList(row));
        }
        return new ExcelTable(outHeaders, outRows);
    }

    private static final class HeaderInfo {
        final List<String> headersInOrder;
        final List<Integer> columnIndexes;
        final Map<String, Integer> normalizedToIndex;

        HeaderInfo(List<String> headersInOrder, List<Integer> columnIndexes, Map<String, Integer> normalizedToIndex) {
            this.headersInOrder = headersInOrder;
            this.columnIndexes = columnIndexes;
            this.normalizedToIndex = normalizedToIndex;
        }
    }

    private HeaderInfo buildHeaderInfo(Row headerRow) {
        if (headerRow == null) return new HeaderInfo(List.of(), List.of(), new HashMap<>());

        short lastCell = headerRow.getLastCellNum();
        if (lastCell <= 0) return new HeaderInfo(List.of(), List.of(), new HashMap<>());

        // Many real-world Excel sheets have styles applied to far-right columns, causing getLastCellNum()
        // to include a large number of trailing blank columns. Trim trailing blank headers so we pivot
        // only the actual header columns that the user uploaded.
        int effectiveLast = 0;
        for (int i = lastCell - 1; i >= 0; i--) {
            Cell cell = headerRow.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            String header = cellToString(cell);
            if (header != null && !header.trim().isEmpty()) {
                effectiveLast = i + 1;
                break;
            }
        }
        if (effectiveLast <= 0) return new HeaderInfo(List.of(), List.of(), new HashMap<>());

        List<String> headers = new ArrayList<>();
        List<Integer> columnIndexes = new ArrayList<>();
        Map<String, Integer> normalizedToIndex = new HashMap<>();

        for (int i = 0; i < effectiveLast; i++) {
            Cell cell = headerRow.getCell(i, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            String header = cellToString(cell);
            header = header == null ? "" : header.trim();
            headers.add(header);
            columnIndexes.add(i);

            String normalized = normalizeHeader(header);
            if (normalized != null && !normalized.isBlank()) {
                normalizedToIndex.putIfAbsent(normalized, i);
            }
        }

        return new HeaderInfo(headers, columnIndexes, normalizedToIndex);
    }

    private List<String> buildRowValues(Row row, List<String> headersInOrder, List<Integer> columnIndexes) {
        List<String> values = new ArrayList<>(headersInOrder.size());
        for (int i = 0; i < headersInOrder.size(); i++) {
            Integer idx = i < columnIndexes.size() ? columnIndexes.get(i) : null;
            Cell cell = (idx == null || row == null) ? null : row.getCell(idx, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            String v = cellToString(cell);
            values.add(v == null ? "" : v);
        }
        return values;
    }

    private String normalizeHeader(String s) {
        if (s == null) return null;
        return s.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "");
    }

    private boolean isRowEmpty(Row row) {
        if (row == null) return true;
        for (Cell cell : row) {
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                String v = cellToString(cell);
                if (v != null && !v.trim().isEmpty()) return false;
            }
        }
        return true;
    }

    private String getString(Row row, Map<String, Integer> headerIndex, String... headerAliases) {
        Integer idx = findIndex(headerIndex, headerAliases);
        if (idx == null) return null;
        Cell cell = row.getCell(idx, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        String v = cellToString(cell);
        return v == null ? null : v.trim();
    }

    private Double getDouble(Row row, Map<String, Integer> headerIndex, String... headerAliases) {
        Integer idx = findIndex(headerIndex, headerAliases);
        if (idx == null) return null;
        Cell cell = row.getCell(idx, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC) return cell.getNumericCellValue();
            String s = cellToString(cell);
            if (s == null || s.trim().isEmpty()) return null;
            return Double.valueOf(s.trim());
        } catch (Exception ignored) {
            return null;
        }
    }

    private LocalDate getLocalDate(Row row, Map<String, Integer> headerIndex, String... headerAliases) {
        Integer idx = findIndex(headerIndex, headerAliases);
        if (idx == null) return null;
        Cell cell = row.getCell(idx, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;

        try {
            if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                Date d = cell.getDateCellValue();
                return d.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
            }
            String s = cellToString(cell);
            if (s == null || s.trim().isEmpty()) return null;

            String t = s.trim();
            // Try common formats
            List<DateTimeFormatter> fmts = List.of(
                DateTimeFormatter.ISO_LOCAL_DATE,
                DateTimeFormatter.ofPattern("d/M/uuuu"),
                DateTimeFormatter.ofPattern("d-M-uuuu"),
                DateTimeFormatter.ofPattern("M/d/uuuu"),
                DateTimeFormatter.ofPattern("uuuu/M/d"),
                DateTimeFormatter.ofPattern("uuuu-M-d")
            );
            for (DateTimeFormatter f : fmts) {
                try {
                    return LocalDate.parse(t, f);
                } catch (Exception ignored) { }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private Integer findIndex(Map<String, Integer> headerIndex, String... headerAliases) {
        for (String alias : headerAliases) {
            String key = normalizeHeader(alias);
            if (key != null && headerIndex.containsKey(key)) return headerIndex.get(key);
        }
        return null;
    }

    private boolean hasAnyHeader(Map<String, Integer> headerIndex, String... headerAliases) {
        return findIndex(headerIndex, headerAliases) != null;
    }

    public ExcelTable getExcelTableByMonth(int year, int month) {
        List<BgvExcelUploadRecord> records = getByMonth(year, month);
        if (records.isEmpty()) return new ExcelTable(List.of(), List.of());

        // Pick the latest uploaded batch in the requested month
        BgvExcelUploadRecord latest = records.get(records.size() - 1);
        String batchId = latest.getUploadBatchId();
        return buildExcelTableFromBatch(batchId);
    }

    public ExcelTableWithMeta getLatestExcelTable() {
        Optional<BgvExcelUploadRecord> latest = repository.findTopByOrderByUploadedAtDesc();
        if (latest.isEmpty()) {
            return new ExcelTableWithMeta(null, null, new ExcelTable(List.of(), List.of()));
        }
        String batchId = latest.get().getUploadBatchId();
        if (batchId == null || batchId.isBlank()) {
            // Fallback: just return empty in case older rows exist without batch id
            return new ExcelTableWithMeta(latest.get().getSourceFilename(), latest.get().getUploadedAt(), new ExcelTable(List.of(), List.of()));
        }
        ExcelTable table = buildExcelTableFromBatch(batchId);
        return new ExcelTableWithMeta(latest.get().getSourceFilename(), latest.get().getUploadedAt(), table);
    }

    public static final class ExcelTableWithMeta {
        public final String sourceFilename;
        public final Long uploadedAt;
        public final ExcelTable table;
        public ExcelTableWithMeta(String sourceFilename, Long uploadedAt, ExcelTable table) {
            this.sourceFilename = sourceFilename;
            this.uploadedAt = uploadedAt;
            this.table = table;
        }
    }

    public static final class ExcelTable {
        public final List<String> headers;
        public final List<List<String>> rows;

        public ExcelTable(List<String> headers, List<List<String>> rows) {
            this.headers = headers;
            this.rows = rows;
        }
    }

    private String cellToString(Cell cell) {
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.STRING) return cell.getStringCellValue();
            if (cell.getCellType() == CellType.NUMERIC) {
                if (DateUtil.isCellDateFormatted(cell)) {
                    Date d = cell.getDateCellValue();
                    return d.toInstant().atZone(ZoneId.systemDefault()).toLocalDate().toString();
                }
                double v = cell.getNumericCellValue();
                if (Math.floor(v) == v) return String.valueOf((long) v);
                return String.valueOf(v);
            }
            if (cell.getCellType() == CellType.BOOLEAN) return String.valueOf(cell.getBooleanCellValue());
            if (cell.getCellType() == CellType.FORMULA) {
                try {
                    return cell.getStringCellValue();
                } catch (Exception ignored) {
                    return String.valueOf(cell.getNumericCellValue());
                }
            }
        } catch (Exception ignored) {
        }
        return "";
    }
}

package com.bgv.application.service;

import com.azure.identity.ClientSecretCredential;
import com.azure.identity.ClientSecretCredentialBuilder;
import com.microsoft.graph.authentication.TokenCredentialAuthProvider;
import com.microsoft.graph.requests.GraphServiceClient;
import okhttp3.Request;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Arrays;
import java.util.List;

@Service
public class SharePointUploadService {

    @Value("${sharepoint.tenant.id:}")
    private String tenantId;

    @Value("${sharepoint.client.id:}")
    private String clientId;

    @Value("${sharepoint.client.secret:}")
    private String clientSecret;

    @Value("${sharepoint.site.id:}")
    private String siteId;

    @Value("${sharepoint.drive.id:}")
    private String driveId;

    @Value("${sharepoint.folder.path:/EXPRESS_REQ_BGV_TEAM}")
    private String folderPath;

    @Value("${sharepoint.enabled:false}")
    private boolean sharepointEnabled;

    private static final String SHAREPOINT_FOLDER_URL = "https://ltimindtree-my.sharepoint.com/:f:/r/personal/anapana_10844334_ltimindtree_com/Documents/EXPRESS_REQ_BGV_TEAM?csf=1&web=1&e=lTcnzE";

    /**
     * Upload a file to SharePoint using Microsoft Graph API
     * 
     * @param file The multipart file to upload
     * @param psNumber PS Number fallback token
     * @param pmName PM name for filename format
     * @param candidateName Candidate/resource name for filename format
     * @return The SharePoint folder URL (not individual file URL for security)
     * @throws Exception if upload fails
     */
    public String uploadToSharePoint(MultipartFile file, String psNumber, String pmName, String candidateName) throws Exception {
        if (!sharepointEnabled) {
            // If SharePoint credentials not configured, return folder URL without actual upload
            // This allows the app to work even without SharePoint integration
            System.out.println("⚠️  SharePoint upload disabled. Configure credentials in application.properties");
            System.out.println("📁 File selected: " + file.getOriginalFilename() + " (Size: " + file.getSize() + " bytes)");
            System.out.println("💡 To enable auto-upload, configure: sharepoint.tenant.id, sharepoint.client.id, sharepoint.client.secret");
            return SHAREPOINT_FOLDER_URL;
        }

        // Validate configuration
        if (tenantId == null || tenantId.isEmpty() || 
            clientId == null || clientId.isEmpty() || 
            clientSecret == null || clientSecret.isEmpty()) {
            throw new IllegalStateException("SharePoint credentials not properly configured. Check application.properties");
        }

        try {
            // Create credentials
            ClientSecretCredential credential = new ClientSecretCredentialBuilder()
                    .clientId(clientId)
                    .clientSecret(clientSecret)
                    .tenantId(tenantId)
                    .build();

            // Create auth provider
            List<String> scopes = Arrays.asList("https://graph.microsoft.com/.default");
            TokenCredentialAuthProvider authProvider = new TokenCredentialAuthProvider(scopes, credential);

            // Build Graph client
            GraphServiceClient<Request> graphClient = GraphServiceClient.builder()
                    .authenticationProvider(authProvider)
                    .buildClient();

            String sanitizedFilename = buildEvidenceFilename(file.getOriginalFilename(), pmName, candidateName, psNumber);

            // Upload file to SharePoint
            // Path format: /drive/items/{driveId}/root:/{folderPath}/{filename}:/content
            String uploadPath = folderPath.endsWith("/") ? folderPath + sanitizedFilename : folderPath + "/" + sanitizedFilename;

            try (InputStream fileStream = file.getInputStream()) {
                // For files < 4MB, use simple upload
                if (file.getSize() < 4 * 1024 * 1024) {
                    graphClient.drives(driveId)
                            .root()
                            .itemWithPath(uploadPath)
                            .content()
                            .buildRequest()
                            .put(fileStream.readAllBytes());
                } else {
                    // For larger files, use upload session (chunked upload)
                    // This is a simplified version - production should use UploadSession API
                    graphClient.drives(driveId)
                            .root()
                            .itemWithPath(uploadPath)
                            .content()
                            .buildRequest()
                            .put(fileStream.readAllBytes());
                }
            }

            System.out.println("✅ File uploaded to SharePoint: " + sanitizedFilename);
            
            // Return the folder URL (not individual file URL for security compliance)
            return SHAREPOINT_FOLDER_URL;

        } catch (Exception e) {
            System.err.println("❌ SharePoint upload failed: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to upload file to SharePoint: " + e.getMessage(), e);
        }
    }

    public String buildEvidenceFilename(String originalFilename, String pmName, String candidateName, String psNumber) {
        String ext = extractExtension(originalFilename);
        String fileType = !ext.isEmpty() ? ext.toLowerCase() : "file";
        String safePm = normalizeToken(pmName);
        String safeCandidate = normalizeToken(candidateName);

        if (safePm.isEmpty() && psNumber != null && !psNumber.trim().isEmpty()) {
            safePm = normalizeToken(psNumber);
        }
        if (safePm.isEmpty()) {
            safePm = "pm";
        }
        if (safeCandidate.isEmpty()) {
            safeCandidate = "candidate";
        }

        String base = safePm + "_" + safeCandidate + "_" + fileType;
        return ext.isEmpty() ? base : base + "." + ext.toLowerCase();
    }

    private String extractExtension(String filename) {
        if (filename == null) return "";
        int idx = filename.lastIndexOf('.');
        if (idx < 0 || idx == filename.length() - 1) return "";
        return filename.substring(idx + 1).replaceAll("[^A-Za-z0-9]", "");
    }

    private String normalizeToken(String value) {
        if (value == null) return "";
        String normalized = value.trim().toLowerCase().replaceAll("[^a-z0-9]+", "_");
        normalized = normalized.replaceAll("_+", "_");
        return normalized.replaceAll("^_|_$", "");
    }

    /**
     * Check if SharePoint integration is properly configured
     */
    public boolean isConfigured() {
        return sharepointEnabled && 
               tenantId != null && !tenantId.isEmpty() &&
               clientId != null && !clientId.isEmpty() &&
               clientSecret != null && !clientSecret.isEmpty();
    }

    /**
     * Get the SharePoint folder URL
     */
    public String getSharePointFolderUrl() {
        return SHAREPOINT_FOLDER_URL;
    }
}

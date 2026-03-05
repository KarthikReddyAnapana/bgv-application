package com.bgv.application.service;

import com.bgv.application.entity.BgvRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.opensearch._types.query_dsl.*;
import org.opensearch.client.opensearch.core.*;
import org.opensearch.client.opensearch.core.search.Hit;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@ConditionalOnProperty(name = "opensearch.enabled", havingValue = "true", matchIfMissing = false)
public class OpenSearchService {

    private static final String BGV_REQUEST_INDEX = "bgv_requests";
    private static final String BGV_HISTORY_INDEX = "bgv_request_history";

    private final OpenSearchClient openSearchClient;
    private final ObjectMapper objectMapper;

    public OpenSearchService(OpenSearchClient openSearchClient, ObjectMapper objectMapper) {
        this.openSearchClient = openSearchClient;
        this.objectMapper = objectMapper;
    }

    // Index a BGV request document
    public void indexBgvRequest(BgvRequest request) {
        try {
            IndexRequest<BgvRequest> indexRequest = IndexRequest.of(i -> i
                .index(BGV_REQUEST_INDEX)
                .id(request.getId())
                .document(request)
            );
            openSearchClient.index(indexRequest);
        } catch (IOException e) {
            throw new RuntimeException("Failed to index BGV request: " + e.getMessage(), e);
        }
    }

    // Delete a BGV request from index
    public void deleteBgvRequest(String id) {
        try {
            DeleteRequest deleteRequest = DeleteRequest.of(d -> d
                .index(BGV_REQUEST_INDEX)
                .id(id)
            );
            openSearchClient.delete(deleteRequest);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete BGV request from index: " + e.getMessage(), e);
        }
    }

    // Search BGV requests by resource name (partial match)
    public List<BgvRequest> searchByResourceName(String resourceName) {
        try {
            SearchRequest searchRequest = SearchRequest.of(s -> s
                .index(BGV_REQUEST_INDEX)
                .query(q -> q
                    .match(m -> m
                        .field("resourceName")
                        .query(v -> v.stringValue(resourceName))
                    )
                )
            );

            SearchResponse<BgvRequest> response = openSearchClient.search(searchRequest, BgvRequest.class);
            return response.hits().hits().stream()
                .map(Hit::source)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        } catch (IOException e) {
            throw new RuntimeException("Failed to search by resource name: " + e.getMessage(), e);
        }
    }

    // Multi-field search across key fields
    public List<BgvRequest> multiFieldSearch(String searchTerm) {
        try {
            SearchRequest searchRequest = SearchRequest.of(s -> s
                .index(BGV_REQUEST_INDEX)
                .query(q -> q
                    .multiMatch(m -> m
                        .query(searchTerm)
                        .fields("psNumber^3", "resourceName^2", "candidateId^3", 
                                "resourcePsNo^3", "requestedByName^2", "bgvInitiatedBy")
                    )
                )
            );

            SearchResponse<BgvRequest> response = openSearchClient.search(searchRequest, BgvRequest.class);
            return response.hits().hits().stream()
                .map(Hit::source)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        } catch (IOException e) {
            throw new RuntimeException("Failed to perform multi-field search: " + e.getMessage(), e);
        }
    }

    // Filter by multiple criteria
    public List<BgvRequest> filterRequests(String status, String userRole, String geoRegion, 
                                           String country, String employeeType) {
        try {
            List<Query> mustQueries = new ArrayList<>();

            if (status != null && !status.isEmpty()) {
                mustQueries.add(Query.of(q -> q.term(t -> t.field("status").value(v -> v.stringValue(status)))));
            }
            if (userRole != null && !userRole.isEmpty()) {
                mustQueries.add(Query.of(q -> q.term(t -> t.field("userRole").value(v -> v.stringValue(userRole)))));
            }
            if (geoRegion != null && !geoRegion.isEmpty()) {
                mustQueries.add(Query.of(q -> q.term(t -> t.field("geoRegion").value(v -> v.stringValue(geoRegion)))));
            }
            if (country != null && !country.isEmpty()) {
                mustQueries.add(Query.of(q -> q.term(t -> t.field("country").value(v -> v.stringValue(country)))));
            }
            if (employeeType != null && !employeeType.isEmpty()) {
                mustQueries.add(Query.of(q -> q.term(t -> t.field("employeeType").value(v -> v.stringValue(employeeType)))));
            }

            SearchRequest searchRequest = SearchRequest.of(s -> s
                .index(BGV_REQUEST_INDEX)
                .query(q -> q
                    .bool(b -> b.must(mustQueries))
                )
            );

            SearchResponse<BgvRequest> response = openSearchClient.search(searchRequest, BgvRequest.class);
            return response.hits().hits().stream()
                .map(Hit::source)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        } catch (IOException e) {
            throw new RuntimeException("Failed to filter requests: " + e.getMessage(), e);
        }
    }

    // Get all requests with pagination
    public List<BgvRequest> getAllRequests(int from, int size) {
        try {
            SearchRequest searchRequest = SearchRequest.of(s -> s
                .index(BGV_REQUEST_INDEX)
                .from(from)
                .size(size)
                .query(q -> q.matchAll(m -> m))
            );

            SearchResponse<BgvRequest> response = openSearchClient.search(searchRequest, BgvRequest.class);
            return response.hits().hits().stream()
                .map(Hit::source)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        } catch (IOException e) {
            throw new RuntimeException("Failed to get all requests: " + e.getMessage(), e);
        }
    }

    // Universal history search (for BgvRequestHistory)
    public List<Map<String, Object>> searchHistory(String searchTerm) {
        try {
            SearchRequest searchRequest = SearchRequest.of(s -> s
                .index(BGV_HISTORY_INDEX)
                .query(q -> q
                    .multiMatch(m -> m
                        .query(searchTerm)
                        .fields("psNumber^3", "resourcePsNo^3", "candidateId^3", 
                                "resourceName^2", "requestedByName")
                    )
                )
                .sort(sort -> sort.field(f -> f.field("snapshotAt").order(org.opensearch.client.opensearch._types.SortOrder.Desc)))
            );

            SearchResponse<Object> response = openSearchClient.search(searchRequest, Object.class);
            return response.hits().hits().stream()
                .map(Hit::source)
                .filter(Objects::nonNull)
                .map(obj -> objectMapper.convertValue(obj, new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {}))
                .collect(Collectors.toList());
        } catch (IOException e) {
            throw new RuntimeException("Failed to search history: " + e.getMessage(), e);
        }
    }

    // Index history document
    public void indexHistory(Map<String, Object> historyData) {
        try {
            @SuppressWarnings("unchecked")
            IndexRequest<Map<String, Object>> indexRequest = IndexRequest.of(i -> i
                .index(BGV_HISTORY_INDEX)
                .id((String) historyData.get("historyId"))
                .document(historyData)
            );
            openSearchClient.index(indexRequest);
        } catch (IOException e) {
            throw new RuntimeException("Failed to index history: " + e.getMessage(), e);
        }
    }
}

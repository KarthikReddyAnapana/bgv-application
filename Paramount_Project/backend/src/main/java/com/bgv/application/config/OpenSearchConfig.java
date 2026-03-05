package com.bgv.application.config;

import org.apache.http.HttpHost;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.opensearch.client.RestClient;
import org.opensearch.client.RestHighLevelClient;
import org.opensearch.client.json.jackson.JacksonJsonpMapper;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.transport.rest_client.RestClientTransport;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "opensearch.enabled", havingValue = "true", matchIfMissing = false)
public class OpenSearchConfig {

    @Value("${opensearch.host:localhost}")
    private String host;

    @Value("${opensearch.port:9200}")
    private int port;

    @Value("${opensearch.scheme:https}")
    private String scheme;

    @Value("${opensearch.username:admin}")
    private String username;

    @Value("${opensearch.password:admin}")
    private String password;

    @Bean
    public OpenSearchClient openSearchClient() {
        BasicCredentialsProvider credentialsProvider = new BasicCredentialsProvider();
        credentialsProvider.setCredentials(
                AuthScope.ANY,
                new UsernamePasswordCredentials(username, password)
        );

        RestClient restClient = RestClient.builder(
                        new HttpHost(host, port, scheme))
                .setHttpClientConfigCallback(httpClientBuilder ->
                        httpClientBuilder.setDefaultCredentialsProvider(credentialsProvider))
                .build();

        RestClientTransport transport = new RestClientTransport(
                restClient, new JacksonJsonpMapper());

        return new OpenSearchClient(transport);
    }

    @Bean
    public RestHighLevelClient restHighLevelClient() {
        BasicCredentialsProvider credentialsProvider = new BasicCredentialsProvider();
        credentialsProvider.setCredentials(
                AuthScope.ANY,
                new UsernamePasswordCredentials(username, password)
        );

        return new RestHighLevelClient(
                RestClient.builder(new HttpHost(host, port, scheme))
                        .setHttpClientConfigCallback(httpClientBuilder ->
                                httpClientBuilder.setDefaultCredentialsProvider(credentialsProvider))
        );
    }
}

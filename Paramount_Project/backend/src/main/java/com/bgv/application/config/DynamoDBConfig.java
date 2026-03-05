// the starting part is for local testing purpose

package com.bgv.application.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.net.URI;

@Configuration
public class DynamoDBConfig {

    @Value("${aws.region:us-east-1}")
    private String awsRegion;

    @Value("${aws.accessKeyId:}")
    private String accessKeyId;

    @Value("${aws.secretKey:}")
    private String secretKey;

    @Value("${dynamodb.endpoint:}")
    private String dynamodbEndpoint;

    @Bean
    public DynamoDbClient dynamoDbClient() {
        boolean hasCustomEndpoint = StringUtils.hasText(dynamodbEndpoint);
        boolean hasStaticCredentials = StringUtils.hasText(accessKeyId) && StringUtils.hasText(secretKey);

        var builder = DynamoDbClient.builder().region(Region.of(awsRegion));

        if (hasCustomEndpoint) {
            if (hasStaticCredentials) {
                AwsBasicCredentials awsCreds = AwsBasicCredentials.create(accessKeyId, secretKey);
                builder.credentialsProvider(StaticCredentialsProvider.create(awsCreds));
            } else {
                AwsBasicCredentials localCreds = AwsBasicCredentials.create("test", "test");
                builder.credentialsProvider(StaticCredentialsProvider.create(localCreds));
            }
            builder.endpointOverride(URI.create(dynamodbEndpoint));
        } else {
            builder.credentialsProvider(DefaultCredentialsProvider.create());
        }

        return builder.build();
    }

    @Bean
    public DynamoDbEnhancedClient dynamoDbEnhancedClient(DynamoDbClient dynamoDbClient) {
        return DynamoDbEnhancedClient.builder()
                .dynamoDbClient(dynamoDbClient)
                .build();
    }
}




// -------------------------------------------------------//
// this is for the actual production - ak

// package com.bgv.application.config;

// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
// import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
// import software.amazon.awssdk.regions.Region;
// import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

// @Configuration
// public class DynamoDBConfig {

//     @Value("${aws.region:us-east-1}")
//     private String awsRegion;

//     @Bean
//     public DynamoDbClient dynamoDbClient() {
//         return DynamoDbClient.builder()
//                 .region(Region.of(awsRegion))
//                 .credentialsProvider(DefaultCredentialsProvider.create())
//                 .build();
//     }

//     @Bean
//     public DynamoDbEnhancedClient dynamoDbEnhancedClient(DynamoDbClient dynamoDbClient) {
//         return DynamoDbEnhancedClient.builder()
//                 .dynamoDbClient(dynamoDbClient)
//                 .build();
//     }
// }

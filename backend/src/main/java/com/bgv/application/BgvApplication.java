package com.bgv.application;

import com.bgv.application.support.DevPortCleaner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.context.annotation.Bean;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@SpringBootApplication
@EnableJpaAuditing
public class BgvApplication {

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    public static void main(String[] args) {
        DevPortCleaner.releaseDefaultPortIfBusy();
        SpringApplication.run(BgvApplication.class, args);
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                String[] origins = Arrays.stream(allowedOrigins.split(","))
                    .map(String::trim)
                    .filter(StringUtils::hasText)
                    .toArray(String[]::new);

                registry.addMapping("/**")
                    .allowedOriginPatterns(origins.length == 0 ? new String[]{"http://localhost:5173"} : origins)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }

}

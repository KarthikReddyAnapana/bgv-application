package com.bgv.application.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class ConfigurationService {

    @Value("${bgv.country.georegion.mapping:INDIA:INDIA,UK:EUROPE,GERMANY:EUROPE,FRANCE:EUROPE,AUSTRALIA:AUSTRALIA,MEXICO:LATAM,BRAZIL:LATAM,USA:USA_AND_CANADA,CANADA:USA_AND_CANADA}")
    private String countryGeoRegionMapping;

    /**
     * Returns the country to geo-region mapping
     * Format: COUNTRY_NAME:GEO_REGION_NAME,COUNTRY_NAME:GEO_REGION_NAME
     */
    public Map<String, String> getCountryToGeoRegionMapping() {
        Map<String, String> mapping = new HashMap<>();
        
        if (countryGeoRegionMapping != null && !countryGeoRegionMapping.isEmpty()) {
            String[] pairs = countryGeoRegionMapping.split(",");
            for (String pair : pairs) {
                String[] keyValue = pair.trim().split(":");
                if (keyValue.length == 2) {
                    mapping.put(keyValue[0].trim(), keyValue[1].trim());
                }
            }
        }
        
        return mapping;
    }
}

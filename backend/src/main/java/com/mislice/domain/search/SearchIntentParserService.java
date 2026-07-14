package com.mislice.domain.search;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class SearchIntentParserService {

    private static final Pattern PRICE_PATTERN = Pattern.compile("(?i)(?:under|<|cheaper than|max|less than)\\s*\\$?(\\d+(?:\\.\\d{2})?)");
    private static final Pattern SIZE_PATTERN = Pattern.compile("(?i)\\b(small|medium|large|extra large|personal|10|12|14|16|18)(?:\"|\\s*inch)?\\b");
    private static final Pattern CRUST_PATTERN = Pattern.compile("(?i)\\b(thin|deep dish|stuffed|pan|brooklyn|detroit)\\b");

    public StructuredSearchQuery parseIntent(String query) {
        if (query == null) {
            query = "";
        }
        String lowerQuery = query.toLowerCase();

        StructuredSearchQuery.StructuredSearchQueryBuilder builder = StructuredSearchQuery.builder()
                .originalQuery(query)
                .sortType(StructuredSearchQuery.SortType.RELEVANCE);

        // 1. Sort Intent
        if (lowerQuery.contains("cheapest") || lowerQuery.contains("lowest") || lowerQuery.contains("cheap")) {
            builder.sortType(StructuredSearchQuery.SortType.CHEAPEST);
        } else if (lowerQuery.contains("fastest") || lowerQuery.contains("quickest")) {
            builder.sortType(StructuredSearchQuery.SortType.FASTEST);
        }

        // 2. Price Filter
        Matcher priceMatcher = PRICE_PATTERN.matcher(lowerQuery);
        if (priceMatcher.find()) {
            try {
                builder.maxPrice(new BigDecimal(priceMatcher.group(1)));
            } catch (Exception ignored) {}
        }

        // 3. Size Filter
        Matcher sizeMatcher = SIZE_PATTERN.matcher(lowerQuery);
        if (sizeMatcher.find()) {
            String rawSize = sizeMatcher.group(1).toLowerCase();
            builder.size(normalizeSize(rawSize));
        }

        // 4. Crust Filter
        Matcher crustMatcher = CRUST_PATTERN.matcher(lowerQuery);
        if (crustMatcher.find()) {
            builder.crustType(crustMatcher.group(1));
        }

        // 5. Category Extractor
        builder.category(extractCategory(lowerQuery));

        return builder.build();
    }

    private String normalizeSize(String sizeStr) {
        if (sizeStr.contains("small") || sizeStr.contains("10")) return "10\"";
        if (sizeStr.contains("medium") || sizeStr.contains("12")) return "12\"";
        if (sizeStr.contains("large") || sizeStr.contains("14")) return "14\"";
        if (sizeStr.contains("extra") || sizeStr.contains("16") || sizeStr.contains("18")) return "16\"";
        if (sizeStr.contains("personal")) return "10\"";
        return "14\""; // fallback
    }

    private String extractCategory(String q) {
        if (q.contains("pepperoni")) return "Pepperoni";
        if (q.contains("meat lover") || q.contains("meat")) return "Meat Lovers";
        if (q.contains("cheese") || q.contains("plain")) return "Cheese";
        if (q.contains("hawaiian") || q.contains("pineapple")) return "Hawaiian";
        if (q.contains("bbq") || q.contains("barbecue")) return "BBQ Chicken";
        if (q.contains("margherita")) return "Margherita";
        if (q.contains("veg")) return "Veggie";
        if (q.contains("supreme")) return "Supreme";
        return null;
    }
}

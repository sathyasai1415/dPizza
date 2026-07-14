package com.mislice.domain.mapping;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@ConditionalOnProperty(name = "mislice.ai.enabled", havingValue = "true")
public class SpringAiTaxonomyClassifier implements AiTaxonomyClassifier {

    private static final Logger log = LoggerFactory.getLogger(SpringAiTaxonomyClassifier.class);

    private final ChatClient chatClient;
    private final TaxonomyPromptFactory promptFactory;
    private final ObjectMapper objectMapper;

    public SpringAiTaxonomyClassifier(ChatClient.Builder chatClientBuilder, TaxonomyPromptFactory promptFactory, ObjectMapper objectMapper) {
        this.chatClient = chatClientBuilder.build();
        this.promptFactory = promptFactory;
        this.objectMapper = objectMapper;
    }

    @Override
    public StandardTaxonomyResult classifyMenuItem(String itemName, String itemDescription) {
        log.info("Calling Spring AI to classify item: {}", itemName);

        String systemPrompt = promptFactory.getSystemPrompt();
        String userPrompt = promptFactory.getUserPrompt(itemName, itemDescription);

        try {
            String responseStr = chatClient.prompt()
                    .system(systemPrompt)
                    .user(userPrompt)
                    .call()
                    .content();

            log.debug("AI Response: {}", responseStr);

            // Clean up markdown code blocks if the AI ignored instructions
            if (responseStr.startsWith("```json")) {
                responseStr = responseStr.substring(7);
            }
            if (responseStr.endsWith("```")) {
                responseStr = responseStr.substring(0, responseStr.length() - 3);
            }

            return objectMapper.readValue(responseStr, StandardTaxonomyResult.class);
        } catch (Exception e) {
            log.error("Failed to parse AI taxonomy response for item {}", itemName, e);
            return new StandardTaxonomyResult(null, null);
        }
    }
}

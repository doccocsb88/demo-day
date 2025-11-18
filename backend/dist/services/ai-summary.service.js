"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AISummaryService = void 0;
const openai_1 = __importDefault(require("openai"));
class AISummaryService {
    constructor() {
        this.openai = null;
        if (process.env.OPENAI_API_KEY) {
            this.openai = new openai_1.default({
                apiKey: process.env.OPENAI_API_KEY,
            });
        }
    }
    async generateSummary(changeRequest) {
        if (!this.openai) {
            return this.generateFallbackSummary(changeRequest);
        }
        try {
            const prompt = this.buildPrompt(changeRequest);
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a release reviewer for Firebase Remote Config. Analyze changes and provide detailed, clear summaries focusing on user impact and risks. When a parameter has a conditional value with a condition, you MUST parse the condition\'s expression and list ALL criteria that make up the condition (country/region, language, app version, percentage ranges, device types, etc.). Do NOT just mention the condition name - you MUST explain what each condition means by parsing its expression. For example, if parameter "A" uses condition "us_1" with expression "user.country == \'US\' && user.randomPercentage >= 0 && user.randomPercentage < 50", you must explain: "Parameter A has a conditional value for condition us_1, which targets users in United States (user.country == \'US\') with random percentage between 0% and 50% (user.randomPercentage >= 0 && user.randomPercentage < 50). This affects 50% of users in United States."',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 1000,
            });
            return response.choices[0]?.message?.content || this.generateFallbackSummary(changeRequest);
        }
        catch (error) {
            console.error('Error generating AI summary:', error);
            return this.generateFallbackSummary(changeRequest);
        }
    }
    buildPrompt(changeRequest) {
        const { diff, newConfig } = changeRequest;
        // Build detailed condition information
        const conditionDetails = [];
        // Added conditions
        diff.addedConditions.forEach((condName) => {
            const condition = newConfig.conditions.find((c) => c.name === condName);
            if (condition) {
                conditionDetails.push(`- Added condition "${condName}": ${condition.expression}`);
            }
        });
        // Removed conditions
        diff.removedConditions.forEach((condName) => {
            conditionDetails.push(`- Removed condition "${condName}"`);
        });
        // Updated conditions with full details
        diff.updatedConditions.forEach((update) => {
            conditionDetails.push(`- Updated condition "${update.name}":\n  From: ${update.from?.expression || 'none'}\n  To: ${update.to?.expression || 'none'}`);
        });
        // Build parameter-condition mapping to show which parameters are affected by which conditions
        // Include full condition expressions so AI can parse and explain them
        const parameterConditionMapping = [];
        diff.updatedParams.forEach((paramUpdate) => {
            const fromConditions = paramUpdate.from?.conditionalValues || {};
            const toConditions = paramUpdate.to?.conditionalValues || {};
            const allConditions = new Set([...Object.keys(fromConditions), ...Object.keys(toConditions)]);
            if (allConditions.size > 0) {
                const conditionChanges = [];
                allConditions.forEach((condName) => {
                    // Find the condition definition to get its expression
                    const condition = newConfig.conditions.find((c) => c.name === condName);
                    const conditionExpression = condition?.expression || 'unknown';
                    const fromValue = fromConditions[condName];
                    const toValue = toConditions[condName];
                    let changeLine = '';
                    if (!fromValue && toValue) {
                        changeLine = `  - Added conditional value for condition "${condName}": ${toValue}`;
                    }
                    else if (fromValue && !toValue) {
                        changeLine = `  - Removed conditional value for condition "${condName}"`;
                    }
                    else if (fromValue !== toValue) {
                        changeLine = `  - Updated conditional value for condition "${condName}": ${fromValue} → ${toValue}`;
                    }
                    if (changeLine) {
                        conditionChanges.push(changeLine);
                        conditionChanges.push(`    Condition "${condName}" expression: ${conditionExpression}`);
                    }
                });
                if (conditionChanges.length > 0) {
                    parameterConditionMapping.push(`Parameter "${paramUpdate.key}" conditional values:\n${conditionChanges.join('\n')}`);
                }
            }
        });
        // Added parameters with conditions
        diff.addedParams.forEach((paramKey) => {
            const param = newConfig.parameters.find((p) => p.key === paramKey);
            if (param?.conditionalValues && Object.keys(param.conditionalValues).length > 0) {
                const condValues = [];
                Object.entries(param.conditionalValues).forEach(([condName, value]) => {
                    const condition = newConfig.conditions.find((c) => c.name === condName);
                    const conditionExpression = condition?.expression || 'unknown';
                    condValues.push(`  - Condition "${condName}": ${value}`);
                    condValues.push(`    Expression: ${conditionExpression}`);
                });
                parameterConditionMapping.push(`New parameter "${paramKey}" with conditional values:\n${condValues.join('\n')}`);
            }
        });
        return `You are a release reviewer for Firebase Remote Config.

Given the following diff between the current config and the proposed change, provide a DETAILED summary in 3 sections:

1. Overall Summary (3-4 sentences)
   - Explain what this change does at a high level
   - Mention key user segments, regions, or percentages affected
   - Highlight the main purpose of the change

2. Detailed Impact Analysis (detailed bullet points)
   - For EACH parameter that has conditional values:
     * List the parameter name and what changed (default value, conditional values, etc.)
     * For EACH condition applied to this parameter:
       - Parse the condition's expression completely
       - List ALL the criteria that make up this condition:
         * Country/Region (e.g., "United States", "Canada")
         * Language (e.g., "English", "Spanish")
         * App version (e.g., ">= 1.0.0", "< 2.0.0")
         * Percentage ranges (e.g., "between 0% and 50%", "50% to 100%")
         * Device types (e.g., "iOS", "Android")
         * Any other criteria in the expression
       - Explain what user segment this condition targets (e.g., "50% of users in United States with app version >= 1.0.0")
       - State what value this user segment will receive for the parameter
     * Mention default values and how they affect users not matching any condition
   - For EACH condition that was added/updated/removed (even if not used in parameters):
     * Parse the expression and list all criteria (country, language, app version, percentage, etc.)
     * Explain what user segment it targets

3. Risk & Rollout Recommendations
   - Identify potential risks based on the changes
   - Recommend rollout strategy (e.g., gradual rollout, A/B testing considerations)
   - Highlight any breaking changes or user-facing impacts

IMPORTANT: 
- When a parameter has a conditional value with a condition (e.g., parameter "A" with condition "us_1"), you MUST:
  1. List the parameter name
  2. List the condition name
  3. Parse the condition's expression and list ALL criteria that make up the condition:
     - Country/Region (if present in expression)
     - Language (if present in expression)
     - App version (if present in expression)
     - Percentage range (if present in expression)
     - Device type (if present in expression)
     - Any other criteria
  4. Explain what user segment this targets (e.g., "50% of users in United States")
  5. State what value this segment receives
- Do NOT just say "condition us_1" - you MUST parse the expression and list all criteria
- Be specific and detailed about each condition's criteria
- Use clear, business-friendly language

Change Request: ${changeRequest.title}
${changeRequest.description ? `Description: ${changeRequest.description}` : ''}

=== DIFF SUMMARY ===
- Added parameters: ${diff.addedParams.length} (${diff.addedParams.join(', ') || 'none'})
- Removed parameters: ${diff.removedParams.length} (${diff.removedParams.join(', ') || 'none'})
- Updated parameters: ${diff.updatedParams.length} (${diff.updatedParams.map((p) => p.key).join(', ') || 'none'})
- Added conditions: ${diff.addedConditions.length} (${diff.addedConditions.join(', ') || 'none'})
- Removed conditions: ${diff.removedConditions.length} (${diff.removedConditions.join(', ') || 'none'})
- Updated conditions: ${diff.updatedConditions.length} (${diff.updatedConditions.map((c) => c.name).join(', ') || 'none'})

=== CONDITION DETAILS ===
${conditionDetails.length > 0 ? conditionDetails.join('\n') : 'No condition changes'}

=== PARAMETER DETAILS ===
${diff.updatedParams
            .map((p) => `Parameter "${p.key}":\n  Default value: ${p.from?.defaultValue || 'none'} → ${p.to?.defaultValue || 'none'}\n  Description: ${p.from?.description || 'none'} → ${p.to?.description || 'none'}`)
            .join('\n\n')}

${diff.addedParams.length > 0 ? `\n=== NEW PARAMETERS ===\n${diff.addedParams.map((key) => {
            const param = newConfig.parameters.find((p) => p.key === key);
            return `Parameter "${key}":\n  Default: ${param?.defaultValue || 'none'}\n  Description: ${param?.description || 'none'}`;
        }).join('\n\n')}` : ''}

${parameterConditionMapping.length > 0 ? `\n=== PARAMETER-CONDITION MAPPING ===\n${parameterConditionMapping.join('\n\n')}` : ''}`;
    }
    generateFallbackSummary(changeRequest) {
        const { diff, newConfig } = changeRequest;
        // Build condition details with expressions
        const conditionDetails = [];
        diff.addedConditions.forEach((condName) => {
            const condition = newConfig.conditions.find((c) => c.name === condName);
            if (condition) {
                conditionDetails.push(`- **${condName}** (Added): ${condition.expression}`);
            }
        });
        diff.removedConditions.forEach((condName) => {
            conditionDetails.push(`- **${condName}** (Removed)`);
        });
        diff.updatedConditions.forEach((update) => {
            conditionDetails.push(`- **${update.name}** (Updated):\n  - From: ${update.from?.expression || 'none'}\n  - To: ${update.to?.expression || 'none'}`);
        });
        // Build parameter details with conditional values
        const parameterDetails = [];
        diff.updatedParams.forEach((paramUpdate) => {
            const details = [`**${paramUpdate.key}** (Updated)`];
            if (paramUpdate.from?.defaultValue !== paramUpdate.to?.defaultValue) {
                details.push(`  - Default value: "${paramUpdate.from?.defaultValue || 'none'}" → "${paramUpdate.to?.defaultValue || 'none'}"`);
            }
            const fromConditions = paramUpdate.from?.conditionalValues || {};
            const toConditions = paramUpdate.to?.conditionalValues || {};
            const allConditions = new Set([...Object.keys(fromConditions), ...Object.keys(toConditions)]);
            if (allConditions.size > 0) {
                const condChanges = [];
                allConditions.forEach((condName) => {
                    // Find the condition definition to get its expression
                    const condition = newConfig.conditions.find((c) => c.name === condName);
                    const conditionExpression = condition?.expression || 'unknown';
                    const fromValue = fromConditions[condName];
                    const toValue = toConditions[condName];
                    if (!fromValue && toValue) {
                        condChanges.push(`    - Added value for condition "${condName}": "${toValue}"`);
                        condChanges.push(`      Condition expression: ${conditionExpression}`);
                    }
                    else if (fromValue && !toValue) {
                        condChanges.push(`    - Removed value for condition "${condName}"`);
                        condChanges.push(`      Condition expression (was): ${conditionExpression}`);
                    }
                    else if (fromValue !== toValue) {
                        condChanges.push(`    - Updated value for condition "${condName}": "${fromValue}" → "${toValue}"`);
                        condChanges.push(`      Condition expression: ${conditionExpression}`);
                    }
                });
                if (condChanges.length > 0) {
                    details.push(`  - Conditional values:`);
                    details.push(...condChanges);
                }
            }
            parameterDetails.push(details.join('\n'));
        });
        diff.addedParams.forEach((paramKey) => {
            const param = newConfig.parameters.find((p) => p.key === paramKey);
            const details = [`**${paramKey}** (Added)`];
            if (param?.defaultValue) {
                details.push(`  - Default value: "${param.defaultValue}"`);
            }
            if (param?.conditionalValues && Object.keys(param.conditionalValues).length > 0) {
                details.push(`  - Conditional values:`);
                Object.entries(param.conditionalValues).forEach(([condName, value]) => {
                    const condition = newConfig.conditions.find((c) => c.name === condName);
                    const conditionExpression = condition?.expression || 'unknown';
                    details.push(`    - Condition "${condName}": "${value}"`);
                    details.push(`      Expression: ${conditionExpression}`);
                });
            }
            parameterDetails.push(details.join('\n'));
        });
        return `## Overall Summary
This change request modifies ${diff.updatedParams.length} parameter(s), adds ${diff.addedParams.length} new parameter(s), removes ${diff.removedParams.length} parameter(s), and affects ${diff.addedConditions.length + diff.removedConditions.length + diff.updatedConditions.length} condition(s).

## Condition Changes
${conditionDetails.length > 0 ? conditionDetails.join('\n\n') : 'No condition changes'}

## Parameter Changes
${parameterDetails.length > 0 ? parameterDetails.join('\n\n') : 'No parameter changes'}

## Risk & Rollout Notes
Please review the parameter changes carefully, especially default value changes and conditional value modifications. Test in staging environment before production deployment.`;
    }
}
exports.AISummaryService = AISummaryService;
//# sourceMappingURL=ai-summary.service.js.map
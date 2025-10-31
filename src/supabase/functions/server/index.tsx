import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-f62db522/health", (c) => {
  return c.json({ status: "ok" });
});

// Generate architecture endpoint
app.post("/make-server-f62db522/api/generate-architecture", async (c) => {
  try {
    const body = await c.req.json();
    const { requirements } = body;

    if (!requirements || requirements.trim().length === 0) {
      return c.json({ error: "Requirements are required" }, 400);
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.log("Error generating architecture: Missing OpenAI API key");
      return c.json({ error: "OpenAI API key not configured" }, 500);
    }

    // Call OpenAI API to generate architecture
    const systemPrompt = `You are an expert Azure cloud architect. Generate a detailed system architecture based on user requirements, ALWAYS prioritizing Azure-native services.

AZURE-FIRST PRIORITY:
- ALWAYS use Azure-native services when available (e.g., "Azure Databricks" instead of "Databricks", "Azure Kubernetes Service" instead of "Kubernetes")
- For third-party services hosted on Azure, use the Azure-managed version (e.g., "Azure Database for PostgreSQL", "Azure Cache for Redis")
- Only use non-Azure services when there's no Azure equivalent
- This is an Azure-focused architecture generator - make Azure the default choice

CRITICAL REQUIREMENTS:
1. EVERY node MUST be connected - no isolated nodes allowed
2. Create a clear hierarchical flow from users to backend services
3. EVERY edge MUST have a descriptive label explaining what data/request flows through it
4. Minimum 6-8 nodes with 8-12 edges showing complete data flow

You must respond with a JSON object containing:
1. "nodes": An array of node objects with { "id": "unique-id", "label": "Display Name", "product": "ProductName", "type": "category", "config": {...} }
   - product should be the AZURE-NATIVE product name when possible
   - type should be one of: "compute", "storage", "database", "messaging", "analytics", "frontend", "gateway", "user", "other"
   - ALWAYS start with a "user" node for user interaction
   - config object (optional for user nodes, recommended for service nodes) with:
     * tier: Service tier (e.g., "Standard", "Premium")
     * skuName: SKU/size (e.g., "S1", "P1v2")
     * region: Azure region (e.g., "East US")
     * rationale: 1-2 sentences why chosen
     * technicalDetails: Brief explanation
     * features: Array of 3-4 key features
     * useCases: Array of 2 use cases
     * bestPractices: Array of 2 best practices
   
2. "edges": An array of edge objects with { "source": "node-id", "target": "node-id", "label": "description" }
   - CRITICAL: Create a complete flow with ALL nodes connected
   - EVERY edge MUST have a label describing what flows through it
   - Examples: "HTTPS Requests", "REST API Calls", "JSON Events", "SQL Queries"
   
3. "description": A detailed explanation of the architecture (2-3 paragraphs)
4. "components": An array of key product names used

Azure-Native Product Names (USE THESE):
- Compute: "Azure Functions", "Azure App Service", "Azure Container Apps", "Azure Kubernetes Service"
- Storage: "Azure Blob Storage", "Azure Data Lake Storage", "Azure Files"
- Databases: "Azure SQL Database", "Azure Cosmos DB", "Azure Database for PostgreSQL", "Azure Cache for Redis"
- Analytics: "Azure Databricks", "Azure Synapse Analytics", "Azure Data Factory", "Azure Stream Analytics"
- Messaging: "Azure Event Hubs", "Azure Service Bus", "Azure Event Grid"
- Gateway/CDN: "Azure API Management", "Azure Application Gateway", "Azure Front Door"
- AI/ML: "Azure OpenAI Service", "Azure Machine Learning", "Azure Cognitive Services"

Example:
{
  "nodes": [
    {"id": "users", "label": "End Users", "product": "User", "type": "user"},
    {
      "id": "api", 
      "label": "API Gateway", 
      "product": "Azure API Management", 
      "type": "gateway",
      "config": {
        "tier": "Standard",
        "skuName": "S1",
        "region": "East US",
        "rationale": "Provides API management and security.",
        "technicalDetails": "Entry point with authentication and rate limiting.",
        "features": ["API throttling", "OAuth 2.0", "Versioning", "Caching"],
        "useCases": ["API gateway", "Rate limiting"],
        "bestPractices": ["Enable caching", "Use versioning"]
      }
    },
    {
      "id": "functions", 
      "label": "Business Logic", 
      "product": "Azure Functions", 
      "type": "compute",
      "config": {
        "tier": "Premium",
        "skuName": "EP1",
        "region": "East US",
        "rationale": "Serverless compute with auto-scaling.",
        "technicalDetails": "Processes requests and coordinates services.",
        "features": ["Auto-scaling", "VNET integration", "Premium performance"],
        "useCases": ["API handlers", "Job processing"],
        "bestPractices": ["Keep stateless", "Use async patterns"]
      }
    },
    {
      "id": "db", 
      "label": "Database", 
      "product": "Azure Database for PostgreSQL", 
      "type": "database",
      "config": {
        "tier": "General Purpose",
        "skuName": "GP_Gen5_2",
        "region": "East US",
        "rationale": "Managed PostgreSQL for transactional data.",
        "technicalDetails": "Stores persistent data with backups.",
        "features": ["Automated backups", "High availability", "Encryption"],
        "useCases": ["Transactional storage", "Complex queries"],
        "bestPractices": ["Use connection pooling", "Index key columns"]
      }
    }
  ],
  "edges": [
    {"source": "users", "target": "api", "label": "HTTPS Requests"},
    {"source": "api", "target": "functions", "label": "REST API Calls"},
    {"source": "functions", "target": "db", "label": "SQL Queries"}
  ],
  "description": "Modern serverless architecture with API gateway, compute functions, and managed database.",
  "components": ["Azure API Management", "Azure Functions", "Azure Database for PostgreSQL"]
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a cloud architecture for: ${requirements}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.log(`OpenAI API error: ${response.status} - ${errorData}`);
      return c.json({ error: "Failed to generate architecture from AI service" }, 500);
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    
    console.log('AI generated content:', JSON.stringify(content, null, 2));
    console.log('Nodes count:', content.nodes?.length);
    console.log('Edges count:', content.edges?.length);
    console.log('Edges:', JSON.stringify(content.edges, null, 2));

    // Store the generated architecture in KV store with timestamp as key
    const timestamp = Date.now();
    const architectureId = `arch_${timestamp}`;
    await kv.set(architectureId, {
      requirements,
      nodes: content.nodes,
      edges: content.edges,
      description: content.description,
      components: content.components || [],
      createdAt: new Date().toISOString(),
    });

    console.log(`Architecture generated successfully: ${architectureId}`);

    return c.json({
      id: architectureId,
      nodes: content.nodes,
      edges: content.edges,
      description: content.description,
      components: content.components || [],
    });
  } catch (error) {
    console.log(`Error in generate-architecture endpoint: ${error.message}`);
    return c.json({ error: `Failed to generate architecture: ${error.message}` }, 500);
  }
});

// Get architecture by ID
app.get("/make-server-f62db522/api/architecture/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const architecture = await kv.get(id);

    if (!architecture) {
      return c.json({ error: "Architecture not found" }, 404);
    }

    return c.json(architecture);
  } catch (error) {
    console.log(`Error fetching architecture: ${error.message}`);
    return c.json({ error: `Failed to fetch architecture: ${error.message}` }, 500);
  }
});

// Start the server
Deno.serve(app.fetch);

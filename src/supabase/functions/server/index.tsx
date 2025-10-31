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
2. Create a clear data flow architecture showing how data moves between services
3. EVERY edge MUST have a descriptive label explaining what data/request flows through it
4. Minimum 6-8 nodes with 8-12 edges showing complete data flow

CRITICAL: NEVER create "user" nodes. This is a technical architecture diagram showing services and data flow only.

DO NOT create any nodes representing people, users, or human actors:
- NO "Data Scientists" nodes
- NO "End Users" nodes  
- NO "Developers" nodes
- NO "Administrators" nodes

Focus only on Azure services and how data flows between them. Start with data ingestion services (Storage, Event Hubs) or API gateways, not human actors.

You must respond with a JSON object containing:
1. "nodes": An array of node objects with { "id": "unique-id", "label": "Display Name", "product": "ProductName", "type": "category", "config": {...} }
   - product should be the AZURE-NATIVE product name when possible
   - type should be one of: "compute", "storage", "database", "messaging", "analytics", "frontend", "gateway", "other"
   - NEVER create nodes with type "user" - focus on services and data flow only
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

AZURE SERVICE NAMING GUIDELINES:
- Use official Azure service names (e.g., "Azure Functions", "Azure SQL Database", "Azure Cosmos DB")
- For Azure-managed versions of third-party services, use "Azure [ServiceName]" format (e.g., "Azure Database for PostgreSQL", "Azure Cache for Redis")
- Choose the most appropriate Azure service for each requirement based on your current knowledge
- Prefer Azure-native solutions over third-party alternatives when equivalent functionality exists

ARCHITECTURAL BEST PRACTICES - Be thoughtful and provide clear reasoning:
- Use whatever services best fit the specific requirements - there are no strict rules against combining services
- When selecting multiple similar services, provide thoughtful rationale explaining why each is needed
- Consider factors like performance, scalability, cost, and integration when making service choices
- Feel free to use both modern and legacy services if they serve different purposes in the architecture
- Focus on creating architectures that solve real business problems rather than following rigid patterns
- NEVER use "Azure Synapse Analytics" - prefer Microsoft Fabric, Azure SQL Database, or other modern analytics services instead
- NEVER use "Azure Data Factory" - prefer Microsoft Fabric as it includes comprehensive data integration and transformation capabilities

Example for DATA PROCESSING (no users):
{
  "nodes": [
    {
      "id": "datasource", 
      "label": "Data Source", 
      "product": "Azure Blob Storage", 
      "type": "storage",
      "config": {
        "tier": "Hot",
        "region": "East US",
        "rationale": "Ingestion point for raw data files.",
        "technicalDetails": "Stores incoming data files for processing.",
        "features": ["Versioning", "Lifecycle management", "Access tiers"],
        "useCases": ["Data ingestion", "Raw data storage"],
        "bestPractices": ["Use lifecycle policies", "Enable soft delete"]
      }
    },
    {
      "id": "processor", 
      "label": "Data Processor", 
      "product": "Azure Databricks", 
      "type": "analytics",
      "config": {
        "tier": "Standard",
        "region": "East US",
        "rationale": "Processes and transforms raw data.",
        "technicalDetails": "Spark-based data processing and transformation.",
        "features": ["Auto-scaling", "Collaborative notebooks", "Delta Lake"],
        "useCases": ["ETL processing", "Data transformation"],
        "bestPractices": ["Use auto-scaling", "Optimize Spark jobs"]
      }
    },
    {
      "id": "warehouse", 
      "label": "Data Warehouse", 
      "product": "Azure Synapse Analytics", 
      "type": "database",
      "config": {
        "tier": "DW100c",
        "region": "East US",
        "rationale": "Stores processed data for analytics.",
        "technicalDetails": "Columnar storage optimized for analytics queries.",
        "features": ["Massively parallel processing", "Elastic scaling"],
        "useCases": ["Data warehousing", "Analytics queries"],
        "bestPractices": ["Use distribution keys", "Optimize table design"]
      }
    }
  ],
  "edges": [
    {"source": "datasource", "target": "processor", "label": "Raw Data Files"},
    {"source": "processor", "target": "warehouse", "label": "Processed Data"}
  ],
  "description": "Data processing pipeline that ingests raw data, processes it, and stores results.",
  "components": ["Azure Blob Storage", "Azure Databricks", "Azure Synapse Analytics"]
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

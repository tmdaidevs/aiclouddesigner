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
    const systemPrompt = `You are an expert cloud architect. Generate a detailed multi-cloud system architecture based on user requirements.

CRITICAL REQUIREMENTS:
1. EVERY node MUST be connected - no isolated nodes allowed
2. Create a clear hierarchical flow from users to backend services
3. EVERY edge MUST have a descriptive label explaining what data/request flows through it
4. Minimum 6-8 nodes with 8-12 edges showing complete data flow

You must respond with a JSON object containing:
1. "nodes": An array of node objects with { "id": "unique-id", "label": "Display Name", "product": "ProductName", "type": "category" }
   - product should be the exact product name (e.g., "AWS Lambda", "Azure Functions", "PostgreSQL", "Redis", "Databricks", etc.)
   - type should be one of: "compute", "storage", "database", "messaging", "analytics", "frontend", "gateway", "user", "other"
   - ALWAYS start with a "user" node for user interaction
   
2. "edges": An array of edge objects with { "source": "node-id", "target": "node-id", "label": "description" }
   - CRITICAL: Create a complete flow with ALL nodes connected - NO ISOLATED NODES
   - Show clear data flow from users through the system
   - Include both request flow and data flow paths  
   - EVERY edge MUST have a label - describe what flows through it
   - Examples: "HTTPS Requests", "REST API Calls", "JSON Events", "SQL Queries", "File Upload", "WebSocket", "gRPC", etc.
   
3. "description": A detailed explanation of the architecture (2-3 paragraphs)
4. "components": An array of key product names used

Architecture Flow Pattern:
- Start with users/clients
- Flow through API gateway/load balancer
- Then to compute layer (functions, containers, etc.)
- Connect to data layer (databases, storage, caches)
- Include analytics/processing pipelines if relevant
- Show messaging/event streams between components

Real Product Names:
- AWS: "AWS Lambda", "AWS S3", "AWS API Gateway", "Amazon RDS", "Amazon DynamoDB", "Amazon CloudFront", "AWS Kinesis", "Amazon SQS"
- Azure: "Azure Functions", "Azure Blob Storage", "Azure SQL Database", "Azure Cosmos DB", "Azure Data Lake", "Azure Event Hubs", "Azure API Management"
- GCP: "Google Cloud Functions", "Google Cloud Storage", "Google BigQuery", "Cloud Run", "Google Pub/Sub"
- Databases: "PostgreSQL", "MongoDB", "Redis", "Elasticsearch", "MySQL", "Cassandra"
- Analytics: "Databricks", "Snowflake", "Apache Spark", "Apache Kafka"
- Other: "Kubernetes", "Docker", "Nginx", "React", "Next.js"

Example (COMPLETE FLOW):
{
  "nodes": [
    {"id": "users", "label": "End Users", "product": "User", "type": "user"},
    {"id": "api", "label": "API Gateway", "product": "AWS API Gateway", "type": "gateway"},
    {"id": "lambda", "label": "Business Logic", "product": "AWS Lambda", "type": "compute"},
    {"id": "cache", "label": "Cache Layer", "product": "Redis", "type": "database"},
    {"id": "db", "label": "Primary Database", "product": "PostgreSQL", "type": "database"},
    {"id": "storage", "label": "File Storage", "product": "AWS S3", "type": "storage"},
    {"id": "queue", "label": "Message Queue", "product": "Amazon SQS", "type": "messaging"},
    {"id": "analytics", "label": "Analytics", "product": "Databricks", "type": "analytics"}
  ],
  "edges": [
    {"source": "users", "target": "api", "label": "HTTPS Requests"},
    {"source": "api", "target": "lambda", "label": "REST API Calls"},
    {"source": "lambda", "target": "cache", "label": "Cache Lookup"},
    {"source": "lambda", "target": "db", "label": "SQL Queries"},
    {"source": "lambda", "target": "storage", "label": "File Upload"},
    {"source": "lambda", "target": "queue", "label": "Async Messages"},
    {"source": "queue", "target": "analytics", "label": "Event Stream"},
    {"source": "db", "target": "analytics", "label": "ETL Pipeline"},
    {"source": "storage", "target": "analytics", "label": "Data Lake Sync"}
  ],
  "description": "...",
  "components": ["AWS API Gateway", "AWS Lambda", "Redis", "PostgreSQL", "AWS S3", "Amazon SQS", "Databricks"]
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

// Helper function to map product names to Azure service names
function getAzureServiceName(product: string): string | null {
  const productLower = product.toLowerCase();
  
  // Functions
  if (productLower.includes('function')) return 'Functions';
  
  // Storage
  if (productLower.includes('blob storage')) return 'Storage';
  if (productLower.includes('storage')) return 'Storage';
  
  // Databases
  if (productLower.includes('sql database')) return 'SQL Database';
  if (productLower.includes('cosmos')) return 'Azure Cosmos DB';
  
  // Compute
  if (productLower.includes('virtual machine') || productLower.includes('vm')) return 'Virtual Machines';
  if (productLower.includes('app service')) return 'Azure App Service';
  if (productLower.includes('container instance')) return 'Container Instances';
  if (productLower.includes('kubernetes') || productLower.includes('aks')) return 'Azure Kubernetes Service';
  
  // Analytics & Big Data
  if (productLower.includes('databricks')) return 'Azure Databricks';
  if (productLower.includes('data lake')) return 'Azure Data Lake Storage';
  if (productLower.includes('synapse')) return 'Azure Synapse Analytics';
  if (productLower.includes('stream analytics')) return 'Stream Analytics';
  if (productLower.includes('data factory')) return 'Data Factory';
  if (productLower.includes('hdinsight')) return 'HDInsight';
  
  // Integration & Messaging
  if (productLower.includes('event hub')) return 'Event Hubs';
  if (productLower.includes('service bus')) return 'Service Bus';
  if (productLower.includes('api management')) return 'API Management';
  if (productLower.includes('logic app')) return 'Logic Apps';
  
  // Cache
  if (productLower.includes('redis')) return 'Azure Cache for Redis';
  if (productLower.includes('cache')) return 'Azure Cache for Redis';
  
  // CDN & Networking
  if (productLower.includes('cdn')) return 'Content Delivery Network';
  if (productLower.includes('front door')) return 'Azure Front Door';
  if (productLower.includes('application gateway')) return 'Application Gateway';
  if (productLower.includes('load balancer')) return 'Load Balancer';
  if (productLower.includes('vpn gateway')) return 'VPN Gateway';
  if (productLower.includes('traffic manager')) return 'Traffic Manager';
  
  // Monitoring & Management
  if (productLower.includes('monitor')) return 'Azure Monitor';
  if (productLower.includes('log analytics')) return 'Log Analytics';
  if (productLower.includes('application insights')) return 'Application Insights';
  
  // AI & ML
  if (productLower.includes('cognitive services')) return 'Cognitive Services';
  if (productLower.includes('machine learning')) return 'Machine Learning';
  if (productLower.includes('openai')) return 'Azure OpenAI';
  
  // Security
  if (productLower.includes('key vault')) return 'Key Vault';
  if (productLower.includes('active directory')) return 'Azure Active Directory';
  
  // IoT
  if (productLower.includes('iot hub')) return 'IoT Hub';
  if (productLower.includes('iot central')) return 'IoT Central';
  
  console.log(`WARNING: Could not map product "${product}" to Azure service name`);
  return null;
}

// Helper function to dynamically generate fields from API meter data
function generateFieldsFromMeters(apiData: any[], regions: string[]) {
  console.log(`Generating dynamic fields from ${apiData.length} API items`);
  
  // Extract unique meters
  const meterMap = new Map();
  apiData.forEach(item => {
    if (item.meterName && item.unitOfMeasure) {
      const key = `${item.meterName}|${item.unitOfMeasure}`;
      if (!meterMap.has(key)) {
        meterMap.set(key, {
          meterName: item.meterName,
          unitOfMeasure: item.unitOfMeasure,
          productName: item.productName
        });
      }
    }
  });

  console.log(`Found ${meterMap.size} unique meters:`, Array.from(meterMap.values()).map(m => m.meterName));

  const fields = [
    {
      id: 'region',
      label: 'Region',
      type: 'select',
      options: regions,
      default: regions[0] || 'eastus',
      required: true
    }
  ];

  // Extract SKUs/Tiers
  const skus = [...new Set(apiData.map(item => item.skuName).filter(Boolean))].sort();
  if (skus.length > 0) {
    fields.push({
      id: 'tier',
      label: 'Tier',
      type: 'select',
      options: skus,
      default: skus[0],
      required: true
    });
  }

  // Generate fields for each unique meter
  Array.from(meterMap.values()).forEach((meter: any) => {
    const meterNameLower = meter.meterName.toLowerCase();
    const unitLower = meter.unitOfMeasure.toLowerCase();
    const baseId = meterNameLower.replace(/[^a-z0-9]/g, '');

    // Determine field configuration based on unit of measure
    if (unitLower.includes('hour') && !unitLower.includes('/')) {
      // Hourly resource - add quantity + hours fields
      fields.push({
        id: `${baseId}Quantity`,
        label: meter.meterName,
        type: 'number',
        default: 1,
        min: 0,
        unit: 'units',
        help: `Number of ${meter.meterName.toLowerCase()}s`
      });
      if (!fields.some(f => f.id === 'hoursPerMonth')) {
        fields.push({
          id: 'hoursPerMonth',
          label: 'Hours per Month',
          type: 'number',
          default: 730,
          min: 1,
          unit: 'hours',
          help: '730 hours = 1 month'
        });
      }
    } else if (unitLower.includes('month') || unitLower.includes('/month')) {
      // Monthly resource
      fields.push({
        id: baseId,
        label: meter.meterName,
        type: 'number',
        default: unitLower.includes('device') ? 0 : 1,
        min: 0,
        unit: unitLower.includes('device') ? 'devices' : 'units/month',
        help: `${meter.meterName} per month`
      });
    } else if (unitLower.includes('gb')) {
      fields.push({
        id: baseId,
        label: meter.meterName,
        type: 'number',
        default: 100,
        min: 0,
        unit: 'GB',
        help: `Storage in GB`
      });
    } else if (unitLower.includes('transaction') || unitLower.includes('request') || unitLower.includes('call')) {
      fields.push({
        id: baseId,
        label: meter.meterName,
        type: 'number',
        default: 0,
        min: 0,
        unit: 'transactions',
        help: `Number of ${meter.meterName.toLowerCase()}s`
      });
    } else {
      // Generic field
      fields.push({
        id: baseId,
        label: meter.meterName,
        type: 'number',
        default: 0,
        min: 0,
        unit: meter.unitOfMeasure,
        help: `${meter.meterName}`
      });
    }
  });

  console.log(`Generated ${fields.length} fields`);
  return { fields };
}

// Dynamic parameter configuration - NO HARDCODING!
function getServiceParameterConfig(serviceName: string, apiData: any[]) {
  const regions = [...new Set(apiData.map(item => item.armRegionName).filter(Boolean))].sort();
  
  console.log(`Generating dynamic fields for ${serviceName} from ${apiData.length} API items`);
  
  // Always use dynamic generation - NO HARDCODING!
  return generateFieldsFromMeters(apiData, regions);
}

// Get available parameters for a product
app.post("/make-server-f62db522/azure-pricing-params", async (c) => {
  try {
    const body = await c.req.json();
    const { product } = body;

    console.log(`\n=== AZURE PRICING PARAMS REQUEST ===`);
    console.log(`Product requested: "${product}"`);

    const serviceName = getAzureServiceName(product);
    
    if (!serviceName) {
      const errorMsg = `Could not find Azure service mapping for "${product}". This may not be an Azure service.`;
      console.log(`ERROR: ${errorMsg}`);
      return c.json({ error: errorMsg }, 400);
    }

    console.log(`Mapped to Azure service: "${serviceName}"`);

    // Fetch a larger sample to get all available options
    const filters = [`serviceName eq '${serviceName}'`];
    const filterString = `$filter=${filters.join(' and ')}`;
    const apiUrl = `https://prices.azure.com/api/retail/prices?${filterString}&$top=100`;

    console.log(`API URL: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Azure API Error: ${response.status} - ${errorText}`);
      return c.json({ error: `Azure API returned error: ${response.status}` }, response.status);
    }

    const data = await response.json();
    const items = data.Items || [];

    console.log(`Fetched ${items.length} pricing items from Azure API`);
    
    // Log first item as sample
    if (items.length > 0) {
      console.log(`Sample item:`, JSON.stringify(items[0], null, 2));
    }

    // Get service-specific parameter configuration
    const config = getServiceParameterConfig(serviceName, items);

    console.log(`Generated ${config.fields.length} parameter fields for ${serviceName}`);
    console.log(`Fields:`, config.fields.map((f: any) => f.id).join(', '));
    console.log(`=== END AZURE PRICING PARAMS ===\n`);

    return c.json({
      serviceName,
      fields: config.fields
    });

  } catch (error) {
    console.log(`Error fetching pricing params: ${error.message}`);
    console.log(`Stack:`, error.stack);
    return c.json({ error: `Failed to fetch pricing parameters: ${error.message}` }, 500);
  }
});

// Calculate pricing for a product
app.post("/make-server-f62db522/calculate-pricing", async (c) => {
  try {
    const body = await c.req.json();
    const { product, parameters } = body;

    console.log(`\n=== CALCULATE AZURE PRICING ===`);
    console.log(`Product: "${product}"`);
    console.log(`Parameters:`, parameters);

    const serviceName = getAzureServiceName(product);
    
    if (!serviceName) {
      return c.json({ error: `Could not find Azure service mapping for "${product}"` }, 400);
    }

    // DYNAMIC PRICING CALCULATION
    // Extract parameters
    const region = parameters.region || 'eastus';
    const tier = parameters.tier || 'Standard';
    
    // Build filters for Azure API
    const filters = [
      `serviceName eq '${serviceName}'`,
      `armRegionName eq '${region}'`
    ];
    
    if (tier) {
      filters.push(`skuName eq '${tier}'`);
    }
    
    const filterString = `$filter=${filters.join(' and ')}`;
    const apiUrl = `https://prices.azure.com/api/retail/prices?${filterString}&$top=100`;

    console.log(`Fetching pricing from Azure API: ${apiUrl}`);

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Azure API error: ${response.status}`);
    }

    const data = await response.json();
    const items = data.Items || [];

    console.log(`Found ${items.length} pricing items`);

    // Group items by meter name
    const meterGroups = new Map();
    items.forEach((item: any) => {
      if (item.meterName) {
        if (!meterGroups.has(item.meterName)) {
          meterGroups.set(item.meterName, []);
        }
        meterGroups.get(item.meterName).push(item);
      }
    });

    console.log(`Found ${meterGroups.size} unique meters:`, Array.from(meterGroups.keys()));

    // Calculate cost for each meter based on user parameters
    const lineItems = [];
    let totalCost = 0;

    meterGroups.forEach((meterItems, meterName) => {
      const item = meterItems[0]; // Use first item as representative
      const meterNameLower = meterName.toLowerCase();
      const unitLower = item.unitOfMeasure.toLowerCase();
      const baseId = meterNameLower.replace(/[^a-z0-9]/g, '');

      // Find matching parameter
      let quantity = 0;
      let calculation = '';

      if (unitLower.includes('hour') && !unitLower.includes('/')) {
        // Hourly resource
        const quantityParam = parameters[`${baseId}Quantity`] || 0;
        const hours = parameters.hoursPerMonth || 730;
        quantity = quantityParam * hours;
        if (quantity > 0) {
          const cost = item.retailPrice * quantity;
          lineItems.push({
            description: meterName,
            calculation: `${quantityParam} units × ${hours} hours × $${item.retailPrice.toFixed(4)}`,
            unitPrice: `$${item.retailPrice.toFixed(4)} per unit-hour`,
            quantity,
            cost
          });
          totalCost += cost;
        }
      } else if (unitLower.includes('month') || unitLower.includes('/month')) {
        // Monthly resource
        quantity = parameters[baseId] || 0;
        if (quantity > 0) {
          const cost = item.retailPrice * quantity;
          lineItems.push({
            description: meterName,
            calculation: `${quantity} units × $${item.retailPrice.toFixed(4)}`,
            unitPrice: `$${item.retailPrice.toFixed(4)} per unit/month`,
            quantity,
            cost
          });
          totalCost += cost;
        }
      } else if (unitLower.includes('gb')) {
        // Storage
        quantity = parameters[baseId] || 0;
        if (quantity > 0) {
          const cost = item.retailPrice * quantity;
          lineItems.push({
            description: meterName,
            calculation: `${quantity} GB × $${item.retailPrice.toFixed(4)}`,
            unitPrice: `$${item.retailPrice.toFixed(4)} per GB`,
            quantity,
            cost
          });
          totalCost += cost;
        }
      } else {
        // Generic
        quantity = parameters[baseId] || 0;
        if (quantity > 0) {
          const cost = item.retailPrice * quantity;
          lineItems.push({
            description: meterName,
            calculation: `${quantity} ${item.unitOfMeasure} × $${item.retailPrice.toFixed(4)}`,
            unitPrice: `$${item.retailPrice.toFixed(4)} per ${item.unitOfMeasure}`,
            quantity,
            cost
          });
          totalCost += cost;
        }
      }
    });

    // If no line items, provide generic estimate
    if (lineItems.length === 0 && items.length > 0) {
      const estimatedCost = items[0].retailPrice * 730;
      lineItems.push({
        description: `${serviceName} (estimated)`,
        calculation: `730 hours × $${items[0].retailPrice.toFixed(4)}`,
        unitPrice: `$${items[0].retailPrice.toFixed(4)} per hour`,
        quantity: 730,
        cost: estimatedCost
      });
      totalCost = estimatedCost;
    }

    console.log(`Total monthly cost: $${totalCost.toFixed(2)}`);
    console.log(`=== END CALCULATE PRICING ===\n`);

    return c.json({
      serviceName,
      region,
      configuration: parameters,
      lineItems,
      totalMonthlyCost: totalCost,
      currency: 'USD',
      disclaimer: 'Prices are estimates based on Azure Retail Prices API. Actual costs may vary.'
    });

  } catch (error) {
    console.log(`Error in pricing calculation: ${error.message}`);
    console.log(`Stack:`, error.stack);
    return c.json({ error: `Failed to calculate pricing: ${error.message}` }, 500);
  }
});

// Get Azure pricing with filters
app.post("/make-server-f62db522/azure-pricing", async (c) => {
  try {
    const body = await c.req.json();
    const { product, region, sku, meterName, productName } = body;

    console.log(`Fetching Azure pricing for:`, { product, region, sku, meterName, productName });

    const serviceName = getAzureServiceName(product);
    
    if (!serviceName) {
      return c.json({ 
        error: `Could not find Azure service mapping for "${product}"` 
      }, 400);
    }

    // Build filter query
    const filters = [`serviceName eq '${serviceName}'`];
    
    if (region) {
      filters.push(`armRegionName eq '${region}'`);
    }
    
    if (sku) {
      filters.push(`skuName eq '${sku}'`);
    }
    
    if (meterName) {
      filters.push(`meterName eq '${meterName}'`);
    }
    
    if (productName) {
      filters.push(`productName eq '${productName}'`);
    }

    const filterString = `$filter=${filters.join(' and ')}`;
    const apiUrl = `https://prices.azure.com/api/retail/prices?${filterString}&$top=50`;

    console.log(`Calling Azure Retail Prices API: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Azure API Error: ${response.status} - ${errorText}`);
      return c.json({ error: `Azure API returned error: ${response.status}` }, response.status);
    }

    const data = await response.json();
    console.log(`Azure API returned ${data.Items?.length || 0} pricing items`);

    return c.json(data);

  } catch (error) {
    console.log(`Error fetching pricing: ${error.message}`);
    return c.json({ error: `Failed to fetch pricing: ${error.message}` }, 500);
  }
});

Deno.serve(app.fetch);

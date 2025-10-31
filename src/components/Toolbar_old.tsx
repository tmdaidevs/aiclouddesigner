import { useState } from 'react';
import { Button } from './ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { Download, Code2, DollarSign, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';

interface ToolbarProps {
  nodes: any[];
  edges: any[];
  currency: string;
  onCurrencyChange: (currency: string) => void;
  configurations?: Record<string, any>;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
];

export function Toolbar({ nodes, edges, currency, onCurrencyChange, configurations }: ToolbarProps) {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<string>('terraform');
  const [generatingIaC, setGeneratingIaC] = useState(false);

  const generateDynamicTemplate = async (format: 'terraform' | 'bicep' | 'arm') => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Prepare architecture description for AI
    const architectureDescription = {
      components: nodes.map(node => ({
        id: node.id,
        type: node.type,
        product: node.data?.product,
        label: node.data?.label,
        position: node.position
      })),
      connections: edges.map(edge => ({
        from: edge.source,
        to: edge.target,
        type: edge.type
      })),
      metadata: {
        totalComponents: nodes.length,
        totalConnections: edges.length,
        format: format,
        timestamp: timestamp
      }
    };

    const prompt = `Generate a production-ready ${format.toUpperCase()} template for Azure deployment based on this architecture:

Components:
${nodes.map(node => `- ${node.data?.product || node.type}: "${node.data?.label || 'Unnamed'}" (ID: ${node.id})`).join('\n')}

Connections:
${edges.map(edge => `- ${edge.source} → ${edge.target}`).join('\n')}

Requirements:
1. Map each component to appropriate Azure resources
2. Use best practices for naming, security, and configuration
3. Include proper dependencies and connections between resources
4. Add meaningful outputs (URLs, connection strings, etc.)
5. Use unique naming with random suffixes
6. Include proper tags for management
7. Follow ${format} syntax and conventions exactly
8. Make it ready for immediate deployment

For ${format}:
${format === 'terraform' ? '- Use azurerm provider v3+\n- Include random provider for unique naming\n- Use proper resource dependencies' : ''}
${format === 'bicep' ? '- Use latest API versions\n- Include parameters for flexibility\n- Use uniqueString() for naming' : ''}
${format === 'arm' ? '- Use 2019-04-01 schema or later\n- Include complete parameter definitions\n- Use proper ARM functions for uniqueness' : ''}

Return only the ${format} template code, no explanations.`;

    try {
      // Try to call AI generation API first
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f62db522/api/generate-iac`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            nodes,
            edges,
            format,
            configurations,
            prompt: prompt,
            architectureDescription
          }),
        }
      );

      if (response.ok) {
        const responseText = await response.text();
        try {
          const data = JSON.parse(responseText);
          return {
            code: data.code,
            filename: data.filename || `azure-architecture-${timestamp}.${format === 'arm' ? 'json' : format}`,
            size: new Blob([data.code]).size,
            source: 'AI'
          };
        } catch (jsonError) {
          throw new Error('Invalid JSON response from API');
        }
      } else {
        throw new Error('API request failed');
      }
    } catch (error) {
      console.warn('AI generation failed, using enhanced fallback:', error);
      return generateEnhancedFallbackTemplate(format, architectureDescription, timestamp);
    }
  };

  const generateEnhancedFallbackTemplate = (format: 'terraform' | 'bicep' | 'arm', architectureDescription: any, timestamp: string) => {
    const components = architectureDescription.components;
    const componentDescriptions = components.map(comp => 
      `${comp.product || comp.type || 'Generic Component'} (${comp.label || 'Unnamed'})`
    ).join(', ');

    // Generate a smart fallback based on detected components
    switch (format) {
      case 'terraform':
        return {
          code: `# AI-Generated Azure Architecture - ${timestamp}
# Components: ${componentDescriptions}
# This is a fallback template - use AI generation for better results

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.0"
    }
    random = {
      source = "hashicorp/random"
      version = "~>3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Generate unique suffix
resource "random_integer" "suffix" {
  min = 1000
  max = 9999
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "rg-ai-architecture-\$\{random_integer.suffix.result\}"
  location = "West Europe"
  
  tags = {
    project = "AI-Generated-Architecture"
    created = "${timestamp}"
    components = "${componentDescriptions}"
  }
}

${components.map((comp, index) => {
  const sanitizedName = (comp.label || `component-${index}`).toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15);
  const product = comp.product?.toLowerCase() || '';
  
  if (product.includes('app') || product.includes('web')) {
    return `
# ${comp.product || comp.type} - ${comp.label || 'Unnamed'}
resource "azurerm_service_plan" "plan_${index}" {
  name                = "plan-${sanitizedName}-\$\{random_integer.suffix.result\}"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  os_type            = "Linux"
  sku_name           = "B1"
}

resource "azurerm_linux_web_app" "app_${index}" {
  name                = "app-${sanitizedName}-\$\{random_integer.suffix.result\}"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  service_plan_id    = azurerm_service_plan.plan_${index}.id
}`;
  } else if (product.includes('sql') || product.includes('database')) {
    return `
# ${comp.product || comp.type} - ${comp.label || 'Unnamed'}
resource "azurerm_mssql_server" "sql_${index}" {
  name                = "sql-${sanitizedName}-\$\{random_integer.suffix.result\}"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  version            = "12.0"
  administrator_login = "sqladmin"
  administrator_login_password = "TempPassword123!"
}`;
  } else {
    return `
# ${comp.product || comp.type} - ${comp.label || 'Unnamed'}
resource "azurerm_storage_account" "storage_${index}" {
  name                = "st${sanitizedName}\$\{random_integer.suffix.result\}"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  account_tier       = "Standard"
  account_replication_type = "LRS"
}`;
  }
}).join('\n')}

# Outputs
output "resource_group_name" {
  value = azurerm_resource_group.main.name
}
`,
          filename: `ai-architecture-${timestamp}.tf`,
          size: 0,
          source: 'Fallback'
        };

      case 'bicep':
        return {
          code: `// AI-Generated Azure Architecture - ${timestamp}
// Components: ${componentDescriptions}
// This is a fallback template - use AI generation for better results

param location string = resourceGroup().location
param uniqueSuffix string = uniqueString(resourceGroup().id)

metadata = {
  description: 'AI-Generated Azure Architecture'
  components: '${componentDescriptions}'
  generated: '${timestamp}'
}

${components.map((comp, index) => {
  const sanitizedName = (comp.label || `component-${index}`).toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15);
  const product = comp.product?.toLowerCase() || '';
  
  if (product.includes('app') || product.includes('web')) {
    return `
// ${comp.product || comp.type} - ${comp.label || 'Unnamed'}
resource servicePlan${index} 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: 'plan-${sanitizedName}-\${uniqueSuffix}'
  location: location
  sku: {
    name: 'B1'
  }
  kind: 'linux'
}`;
  } else if (product.includes('storage')) {
    return `
// ${comp.product || comp.type} - ${comp.label || 'Unnamed'}
resource storage${index} 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'st${sanitizedName}\${uniqueSuffix}'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
}`;
  } else {
    return `
// ${comp.product || comp.type} - ${comp.label || 'Unnamed'}
resource resource${index} 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'res${sanitizedName}\${uniqueSuffix}'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
}`;
  }
}).join('\n')}
`,
          filename: `ai-architecture-${timestamp}.bicep`,
          size: 0,
          source: 'Fallback'
        };

      case 'arm':
        return {
          code: JSON.stringify({
            "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
            "contentVersion": "1.0.0.0",
            "metadata": {
              "description": `AI-Generated Azure Architecture - ${timestamp}`,
              "components": componentDescriptions
            },
            "parameters": {
              "location": {
                "type": "string",
                "defaultValue": "[resourceGroup().location]"
              }
            },
            "variables": {
              "uniqueSuffix": "[uniqueString(resourceGroup().id)]"
            },
            "resources": components.map((comp, index) => {
              const sanitizedName = (comp.label || `component-${index}`).toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15);
              return {
                "type": "Microsoft.Storage/storageAccounts",
                "apiVersion": "2023-01-01",
                "name": `[concat('st${sanitizedName}', variables('uniqueSuffix'))]`,
                "location": "[parameters('location')]",
                "sku": {
                  "name": "Standard_LRS"
                },
                "tags": {
                  "component": comp.product || comp.type || 'Unknown',
                  "label": comp.label || 'Unnamed'
                }
              };
            }),
            "outputs": {}
          }, null, 2),
          filename: `ai-architecture-${timestamp}.json`,
          size: 0,
          source: 'Fallback'
        };

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  };

  // Main IaC generation handler
  const handleGenerateIaC = async () => {
    if (!nodes.length) {
      alert('Keine Komponenten zum Exportieren vorhanden. Fügen Sie zunächst Komponenten zu Ihrem Diagramm hinzu.');
      return;
    }

    const format = exportFormat as 'terraform' | 'bicep' | 'arm';
    setGeneratingIaC(true);
    
    try {
      console.log('Generating template with AI for format:', format);
      console.log('Architecture components:', nodes.length);
      
      const result = await generateDynamicTemplate(format);
      
      if (!result || !result.code) {
        throw new Error('Keine Template-Inhalte generiert');
      }

      // Create and download the file
      const blob = new Blob([result.code], { 
        type: format === 'arm' ? 'application/json' : 'text/plain' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);

      console.log('Template generated successfully:', {
        format,
        filename: result.filename,
        size: result.size,
        source: result.source
      });

    } catch (error) {
      console.error('Template generation failed:', error);
      alert(`Template-Generierung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setGeneratingIaC(false);
    }
  };

  // Add projectId and publicAnonKey for Supabase calls
  const projectId = 'wvvpjblqfqaakdzgekfd';
  const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2dnBqYmxxZnFhYWtkemdenGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMzc5NDYsImV4cCI6MjA0OTYxMzk0Nn0.2FDsTEqlNT_KTRNRkTycIg8JlRMImCttsjKFNO4lmIM';

  const formatNumber = (num: number): string => {
      return {
        type: 'function_app',
        terraform: `# ${node.data?.product || 'Function App'}
resource "azurerm_storage_account" "func_storage_${index}" {
  name                     = "stfunc${sanitizedName}\$\{random_integer.suffix.result\}"
  resource_group_name      = azurerm_resource_group.main.name
  location                = azurerm_resource_group.main.location
  account_tier            = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_service_plan" "func_plan_${index}" {
  name                = "plan-func-${sanitizedName}"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  os_type            = "Linux"
  sku_name           = "Y1"
}

resource "azurerm_linux_function_app" "func_${index}" {
  name                = "func-${sanitizedName}-\$\{random_integer.suffix.result\}"
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  service_plan_id    = azurerm_service_plan.func_plan_${index}.id
  storage_account_name = azurerm_storage_account.func_storage_${index}.name
  storage_account_access_key = azurerm_storage_account.func_storage_${index}.primary_access_key
  
  site_config {
    application_stack {
      node_version = "18"
    }
  }
  
  tags = {
    component = "${node.data?.product || 'function-app'}"
    environment = "production"
  }
}`,
        bicep: `
// ${node.data?.product || 'Function App'}
resource funcStorage${index} 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'stfunc${sanitizedName}\${uniqueString(resourceGroup().id)}'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'Storage'
}

resource funcPlan${index} 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: 'plan-func-${sanitizedName}'
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  kind: 'functionapp'
  properties: {
    reserved: true
  }
}

resource functionApp${index} 'Microsoft.Web/sites@2023-01-01' = {
  name: 'func-${sanitizedName}-\${uniqueString(resourceGroup().id)}'
  location: location
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: funcPlan${index}.id
    siteConfig: {
      linuxFxVersion: 'NODE|18'
    }
  }
}`,
        arm: {
          type: "Microsoft.Web/sites",
          apiVersion: "2023-01-01",
          name: `func-${sanitizedName}`,
          kind: "functionapp,linux",
          properties: {
            siteConfig: {
              linuxFxVersion: "NODE|18"
            }
          }
        }
      };
    }
    
    // Default fallback - Storage Account
    return {
      type: 'storage_account',
      terraform: `# ${node.data?.product || 'Component'} (mapped to Storage Account)
resource "azurerm_storage_account" "component_${index}" {
  name                     = "st${sanitizedName}\$\{random_integer.suffix.result\}"
  resource_group_name      = azurerm_resource_group.main.name
  location                = azurerm_resource_group.main.location
  account_tier            = "Standard"
  account_replication_type = "LRS"
  
  tags = {
    component = "${node.data?.product || 'component'}"
    environment = "production"
    note = "Mapped from: ${node.data?.product || 'Unknown component'}"
  }
}`,
      bicep: `
// ${node.data?.product || 'Component'} (mapped to Storage Account)
resource component${index} 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'st${sanitizedName}\${uniqueString(resourceGroup().id)}'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  tags: {
    component: '${node.data?.product || 'component'}'
    environment: 'production'
    note: 'Mapped from: ${node.data?.product || 'Unknown component'}'
  }
}`,
      arm: {
        type: "Microsoft.Storage/storageAccounts",
        apiVersion: "2023-01-01",
        name: `st${sanitizedName}`,
        sku: {
          name: "Standard_LRS"
        },
        tags: {
          component: node.data?.product || 'component',
          note: `Mapped from: ${node.data?.product || 'Unknown component'}`
        }
      }
    };
  };

  const generateMockTemplate = (format: 'terraform' | 'bicep' | 'arm') => {
    const nodeNames = nodes.map(node => node.data?.product || node.type || 'component');
    const timestamp = new Date().toISOString().split('T')[0];
    const resourceMappings = nodes.map((node, index) => mapNodeToAzureResource(node, index));
    
    switch (format) {
      case 'terraform':
        return {
          code: `# Azure Architecture - Generated on ${timestamp}
# Resources: ${nodeNames.join(', ')}
# This template is ready to deploy with 'terraform apply'

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.0"
    }
    random = {
      source = "hashicorp/random"
      version = "~>3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Generate random suffix for unique naming
resource "random_integer" "suffix" {
  min = 1000
  max = 9999
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "rg-architecture-\$\{random_integer.suffix.result\}"
  location = "West Europe"
  
  tags = {
    project = "AI-Generated-Architecture"
    created = "${timestamp}"
  }
}

${resourceMappings.map(resource => resource.terraform).join('\n')}

# Outputs
${resourceMappings.map((resource, index) => {
  const node = nodes[index];
  const sanitizedName = (node.data?.label || `component-${index}`).toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
  
  if (resource.type === 'app_service') {
    return `
output "${sanitizedName}_url" {
  description = "URL of the ${node.data?.product || 'App Service'}"
  value       = azurerm_linux_web_app.app_${index}.default_hostname
}`;
  } else if (resource.type === 'sql_database') {
    return `
output "${sanitizedName}_server" {
  description = "SQL Server name for ${node.data?.product || 'SQL Database'}"
  value       = azurerm_mssql_server.sql_${index}.fully_qualified_domain_name
}`;
  } else if (resource.type === 'function_app') {
    return `
output "${sanitizedName}_function_url" {
  description = "Function App URL for ${node.data?.product || 'Function App'}"
  value       = azurerm_linux_function_app.func_${index}.default_hostname
}`;
  } else {
    return `
output "${sanitizedName}_storage_endpoint" {
  description = "Storage endpoint for ${node.data?.product || 'Storage Account'}"
  value       = azurerm_storage_account.component_${index}.primary_blob_endpoint
}`;
  }
}).join('')}
`,
          filename: `azure-architecture-${timestamp}.tf`,
          size: 0
        };
        
      case 'bicep':
        return {
          code: `// Azure Architecture - Generated on ${timestamp}
// Resources: ${nodeNames.join(', ')}
// This template is ready to deploy with 'az deployment group create'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Environment name')
param environmentName string = 'production'

@description('Unique suffix for resource naming')
param uniqueSuffix string = uniqueString(resourceGroup().id)

// Metadata
metadata = {
  description: 'AI-Generated Azure Architecture'
  author: 'AI Architecture Generator'
  generated: '${timestamp}'
}

${resourceMappings.map(resource => resource.bicep).join('\n')}

// Outputs
${resourceMappings.map((resource, index) => {
  const node = nodes[index];
  const sanitizedName = (node.data?.label || `component-${index}`).toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
  
  if (resource.type === 'app_service') {
    return `
output ${sanitizedName}Url string = 'https://\${webApp${index}.properties.defaultHostName}'`;
  } else if (resource.type === 'sql_database') {
    return `
output ${sanitizedName}Server string = sqlServer${index}.properties.fullyQualifiedDomainName`;
  } else if (resource.type === 'function_app') {
    return `
output ${sanitizedName}FunctionUrl string = 'https://\${functionApp${index}.properties.defaultHostName}'`;
  } else {
    return `
output ${sanitizedName}StorageEndpoint string = storageAccount${index}.properties.primaryEndpoints.blob`;
  }
}).join('')}
`,
          filename: `azure-architecture-${timestamp}.bicep`,
          size: 0
        };
        
      case 'arm':
        const armResources = resourceMappings.map((resource, index) => {
          const node = nodes[index];
          const sanitizedName = (node.data?.label || `component-${index}`).toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
          
          if (resource.type === 'app_service') {
            return [
              {
                "type": "Microsoft.Web/serverfarms",
                "apiVersion": "2023-01-01",
                "name": `plan-${sanitizedName}`,
                "location": "[parameters('location')]",
                "sku": {
                  "name": "B1",
                  "tier": "Basic"
                },
                "kind": "linux",
                "properties": {
                  "reserved": true
                }
              },
              {
                "type": "Microsoft.Web/sites",
                "apiVersion": "2023-01-01",
                "name": `[concat('app-${sanitizedName}-', uniqueString(resourceGroup().id))]`,
                "location": "[parameters('location')]",
                "dependsOn": [
                  `[resourceId('Microsoft.Web/serverfarms', 'plan-${sanitizedName}')]`
                ],
                "properties": {
                  "serverFarmId": `[resourceId('Microsoft.Web/serverfarms', 'plan-${sanitizedName}')]`,
                  "siteConfig": {
                    "linuxFxVersion": "NODE|18-lts"
                  }
                },
                "tags": {
                  "component": node.data?.product || 'app-service',
                  "environment": "production"
                }
              }
            ];
          } else if (resource.type === 'sql_database') {
            return [
              {
                "type": "Microsoft.Sql/servers",
                "apiVersion": "2023-05-01-preview",
                "name": `[concat('sql-${sanitizedName}-', uniqueString(resourceGroup().id))]`,
                "location": "[parameters('location')]",
                "properties": {
                  "administratorLogin": "[parameters('sqlAdminLogin')]",
                  "administratorLoginPassword": "[parameters('sqlAdminPassword')]",
                  "version": "12.0",
                  "minimalTlsVersion": "1.2"
                }
              },
              {
                "type": "Microsoft.Sql/servers/databases",
                "apiVersion": "2023-05-01-preview",
                "name": `[concat('sql-${sanitizedName}-', uniqueString(resourceGroup().id), '/db-${sanitizedName}')]`,
                "dependsOn": [
                  `[resourceId('Microsoft.Sql/servers', concat('sql-${sanitizedName}-', uniqueString(resourceGroup().id)))]`
                ],
                "properties": {
                  "collation": "SQL_Latin1_General_CP1_CI_AS"
                },
                "sku": {
                  "name": "Basic",
                  "tier": "Basic"
                }
              }
            ];
          } else {
            return [
              {
                "type": "Microsoft.Storage/storageAccounts",
                "apiVersion": "2023-01-01",
                "name": `[concat('st${sanitizedName}', uniqueString(resourceGroup().id))]`,
                "location": "[parameters('location')]",
                "sku": {
                  "name": "Standard_LRS"
                },
                "kind": "StorageV2",
                "properties": {
                  "supportsHttpsTrafficOnly": true,
                  "minimumTlsVersion": "TLS1_2",
                  "accessTier": "Hot"
                },
                "tags": {
                  "component": node.data?.product || 'component',
                  "environment": "production"
                }
              }
            ];
          }
        }).flat();
        
        return {
          code: JSON.stringify({
            "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
            "contentVersion": "1.0.0.0",
            "metadata": {
              "description": `AI-Generated Azure Architecture - ${timestamp}`,
              "author": "AI Architecture Generator",
              "resources": nodeNames,
              "generated": timestamp
            },
            "parameters": {
              "location": {
                "type": "string",
                "defaultValue": "[resourceGroup().location]",
                "metadata": {
                  "description": "Location for all resources"
                }
              },
              "environment": {
                "type": "string",
                "defaultValue": "production",
                "metadata": {
                  "description": "Environment name (dev, staging, production)"
                }
              },
              "sqlAdminLogin": {
                "type": "string",
                "defaultValue": "sqladmin",
                "metadata": {
                  "description": "SQL Server administrator login (required if SQL resources are present)"
                }
              },
              "sqlAdminPassword": {
                "type": "secureString",
                "defaultValue": "P@ssw0rd123!",
                "metadata": {
                  "description": "SQL Server administrator password (required if SQL resources are present)"
                }
              }
            },
            "variables": {
              "uniqueSuffix": "[uniqueString(resourceGroup().id)]"
            },
            "resources": armResources,
            "outputs": resourceMappings.reduce((outputs: Record<string, any>, resource, index) => {
              const node = nodes[index];
              const sanitizedName = (node.data?.label || `component-${index}`).toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
              
              if (resource.type === 'app_service') {
                outputs[`${sanitizedName}Url`] = {
                  "type": "string",
                  "value": `[concat('https://', reference(resourceId('Microsoft.Web/sites', concat('app-${sanitizedName}-', variables('uniqueSuffix')))).defaultHostName)]`
                };
              } else if (resource.type === 'sql_database') {
                outputs[`${sanitizedName}Server`] = {
                  "type": "string",
                  "value": `[reference(resourceId('Microsoft.Sql/servers', concat('sql-${sanitizedName}-', variables('uniqueSuffix')))).fullyQualifiedDomainName]`
                };
              } else {
                outputs[`${sanitizedName}StorageEndpoint`] = {
                  "type": "string",
                  "value": `[reference(resourceId('Microsoft.Storage/storageAccounts', concat('st${sanitizedName}', variables('uniqueSuffix')))).primaryEndpoints.blob]`
                };
              }
              
              return outputs;
            }, {} as Record<string, any>)
          }, null, 2),
          filename: `azure-architecture-${timestamp}.json`,
          size: 0
        };
        
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  };

  const handleGenerateIaC = async (format: 'terraform' | 'bicep' | 'arm') => {
    if (nodes.length === 0) {
      toast.error('No Architecture', {
        description: 'Please generate an architecture first.',
      });
      return;
    }

    setIsGenerating(format);

    try {
      console.log(`Generating ${format} template...`);
      
      // Try API first, fallback to mock
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f62db522/api/generate-iac`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              nodes,
              edges,
              format,
              configurations,
            }),
          }
        );

        let data;
        const responseText = await response.text();
        
        // Check if response is JSON
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          console.warn('API returned non-JSON response, using mock template');
          throw new Error('Invalid JSON response from API');
        }

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate template');
        }

        console.log(`Generated ${format} template:`, data);

        // Create a download
        const blob = new Blob([data.code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(`${format.toUpperCase()} Generated`, {
          description: `Downloaded ${data.filename} (API)`,
          duration: 4000,
        });
        
      } catch (apiError) {
        console.warn('API failed, using mock template:', apiError);
        
        // Generate mock template
        const mockData = generateMockTemplate(format);
        mockData.size = new Blob([mockData.code]).size;
        
        // Create a download
        const blob = new Blob([mockData.code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = mockData.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(`${format.toUpperCase()} Generated`, {
          description: `Downloaded ${mockData.filename} (${(mockData.size / 1024).toFixed(1)} KB) - Demo Template`,
          duration: 4000,
        });
      }

    } catch (error) {
      console.error(`Error generating ${format}:`, error);
      toast.error('Generation Failed', {
        description: error instanceof Error ? error.message : 'Failed to generate template',
      });
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Currency Selector */}
      <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
        <DollarSign className="w-4 h-4 text-blue-600" />
        <Select value={currency} onValueChange={onCurrencyChange}>
          <SelectTrigger className="h-8 w-[140px] border-0 bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((curr) => (
              <SelectItem key={curr.code} value={curr.code}>
                {curr.symbol} {curr.code} - {curr.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-300" />

      {/* IaC Generation */}
      <div className="flex items-center gap-2">
        <Code2 className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-600">Export:</span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleGenerateIaC('terraform')}
          disabled={isGenerating !== null}
          className="h-8"
        >
          {isGenerating === 'terraform' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-1" />
          )}
          Terraform
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleGenerateIaC('bicep')}
          disabled={isGenerating !== null}
          className="h-8"
        >
          {isGenerating === 'bicep' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-1" />
          )}
          Bicep
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleGenerateIaC('arm')}
          disabled={isGenerating !== null}
          className="h-8"
        >
          {isGenerating === 'arm' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-1" />
          )}
          ARM Template
        </Button>
      </div>
    </div>
  );
}

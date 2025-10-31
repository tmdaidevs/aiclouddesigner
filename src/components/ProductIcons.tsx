// Product icon mapping - uses Simple Icons CDN and other sources
// Note: Simple Icons CDN format is https://cdn.simpleicons.org/{slug} or https://cdn.simpleicons.org/{slug}/{hexcolor}
export const getProductIcon = (productName?: string): { url: string; bgColor: string; textColor: string } => {
  const product = (productName || '').toLowerCase();
  
  // AWS Services
  if (product.includes('aws') || product.includes('amazon')) {
    if (product.includes('lambda')) {
      return { url: 'https://cdn.simpleicons.org/awslambda', bgColor: '#FF9900', textColor: '#FFFFFF' };
    }
    if (product.includes('s3')) {
      return { url: 'https://cdn.simpleicons.org/amazons3', bgColor: '#569A31', textColor: '#FFFFFF' };
    }
    if (product.includes('api gateway')) {
      return { url: 'https://cdn.simpleicons.org/amazonapigateway', bgColor: '#FF4F8B', textColor: '#FFFFFF' };
    }
    if (product.includes('dynamodb')) {
      return { url: 'https://cdn.simpleicons.org/amazondynamodb', bgColor: '#4053D6', textColor: '#FFFFFF' };
    }
    if (product.includes('rds')) {
      return { url: 'https://cdn.simpleicons.org/amazonrds', bgColor: '#527FFF', textColor: '#FFFFFF' };
    }
    if (product.includes('cloudfront')) {
      return { url: 'https://cdn.simpleicons.org/amazoncloudwatch', bgColor: '#FF4F8B', textColor: '#FFFFFF' };
    }
    if (product.includes('kinesis')) {
      return { url: 'https://cdn.simpleicons.org/amazonkinesis', bgColor: '#FF9900', textColor: '#FFFFFF' };
    }
    if (product.includes('sqs') || product.includes('simple queue')) {
      return { url: 'https://cdn.simpleicons.org/amazonsqs', bgColor: '#FF4F8B', textColor: '#FFFFFF' };
    }
    if (product.includes('ec2')) {
      return { url: 'https://cdn.simpleicons.org/amazonec2', bgColor: '#FF9900', textColor: '#FFFFFF' };
    }
    if (product.includes('eks') || product.includes('elastic kubernetes')) {
      return { url: 'https://cdn.simpleicons.org/amazoneks', bgColor: '#FF9900', textColor: '#FFFFFF' };
    }
    // Generic AWS
    return { url: 'https://cdn.simpleicons.org/amazonaws', bgColor: '#232F3E', textColor: '#FFFFFF' };
  }
  
  // Azure Services
  if (product.includes('azure') || product.includes('microsoft')) {
    if (product.includes('function')) {
      return { url: 'https://cdn.simpleicons.org/azurefunctions', bgColor: '#0062AD', textColor: '#FFFFFF' };
    }
    if (product.includes('blob') || product.includes('storage')) {
      return { url: 'https://cdn.simpleicons.org/microsoftazure', bgColor: '#0078D4', textColor: '#FFFFFF' };
    }
    if (product.includes('cosmos')) {
      return { url: 'https://cdn.simpleicons.org/microsoftazure', bgColor: '#0078D4', textColor: '#FFFFFF' };
    }
    if (product.includes('sql')) {
      return { url: 'https://cdn.simpleicons.org/microsoftsqlserver', bgColor: '#CC2927', textColor: '#FFFFFF' };
    }
    if (product.includes('data lake')) {
      return { url: 'https://cdn.simpleicons.org/microsoftazure', bgColor: '#0078D4', textColor: '#FFFFFF' };
    }
    // Generic Azure
    return { url: 'https://cdn.simpleicons.org/microsoftazure', bgColor: '#0078D4', textColor: '#FFFFFF' };
  }
  
  // Google Cloud Services
  if (product.includes('google') || product.includes('gcp') || product.includes('cloud run') || product.includes('bigquery')) {
    if (product.includes('cloud run')) {
      return { url: 'https://cdn.simpleicons.org/googlecloud', bgColor: '#4285F4', textColor: '#FFFFFF' };
    }
    if (product.includes('bigquery')) {
      return { url: 'https://cdn.simpleicons.org/googlebigquery', bgColor: '#669DF6', textColor: '#FFFFFF' };
    }
    if (product.includes('pub/sub') || product.includes('pubsub')) {
      return { url: 'https://cdn.simpleicons.org/googlecloud', bgColor: '#4285F4', textColor: '#FFFFFF' };
    }
    if (product.includes('storage')) {
      return { url: 'https://cdn.simpleicons.org/googlecloud', bgColor: '#4285F4', textColor: '#FFFFFF' };
    }
    // Generic GCP
    return { url: 'https://cdn.simpleicons.org/googlecloud', bgColor: '#4285F4', textColor: '#FFFFFF' };
  }
  
  // Databases
  if (product.includes('postgresql') || product.includes('postgres')) {
    return { url: 'https://cdn.simpleicons.org/postgresql', bgColor: '#4169E1', textColor: '#FFFFFF' };
  }
  if (product.includes('mongodb') || product.includes('mongo')) {
    return { url: 'https://cdn.simpleicons.org/mongodb', bgColor: '#47A248', textColor: '#FFFFFF' };
  }
  if (product.includes('redis')) {
    return { url: 'https://cdn.simpleicons.org/redis', bgColor: '#DC382D', textColor: '#FFFFFF' };
  }
  if (product.includes('mysql')) {
    return { url: 'https://cdn.simpleicons.org/mysql', bgColor: '#4479A1', textColor: '#FFFFFF' };
  }
  if (product.includes('elasticsearch')) {
    return { url: 'https://cdn.simpleicons.org/elasticsearch', bgColor: '#005571', textColor: '#FFFFFF' };
  }
  if (product.includes('cassandra')) {
    return { url: 'https://cdn.simpleicons.org/apachecassandra', bgColor: '#1287B1', textColor: '#FFFFFF' };
  }
  
  // Analytics & Data
  if (product.includes('databricks')) {
    return { url: 'https://cdn.simpleicons.org/databricks', bgColor: '#FF3621', textColor: '#FFFFFF' };
  }
  if (product.includes('snowflake')) {
    return { url: 'https://cdn.simpleicons.org/snowflake', bgColor: '#29B5E8', textColor: '#FFFFFF' };
  }
  if (product.includes('apache spark') || product.includes('spark')) {
    return { url: 'https://cdn.simpleicons.org/apachespark', bgColor: '#E25A1C', textColor: '#FFFFFF' };
  }
  if (product.includes('power bi')) {
    return { url: 'https://cdn.simpleicons.org/powerbi', bgColor: '#F2C811', textColor: '#000000' };
  }
  if (product.includes('tableau')) {
    return { url: 'https://cdn.simpleicons.org/tableau', bgColor: '#E97627', textColor: '#FFFFFF' };
  }
  
  // Messaging
  if (product.includes('kafka')) {
    return { url: 'https://cdn.simpleicons.org/apachekafka', bgColor: '#231F20', textColor: '#FFFFFF' };
  }
  if (product.includes('rabbitmq')) {
    return { url: 'https://cdn.simpleicons.org/rabbitmq', bgColor: '#FF6600', textColor: '#FFFFFF' };
  }
  if (product.includes('service bus')) {
    return { url: 'https://cdn.simpleicons.org/microsoftazure', bgColor: '#0078D4', textColor: '#FFFFFF' };
  }
  if (product.includes('event hub')) {
    return { url: 'https://cdn.simpleicons.org/microsoftazure', bgColor: '#0078D4', textColor: '#FFFFFF' };
  }
  
  // Container & Orchestration
  if (product.includes('kubernetes') || product.includes('k8s')) {
    return { url: 'https://cdn.simpleicons.org/kubernetes', bgColor: '#326CE5', textColor: '#FFFFFF' };
  }
  if (product.includes('docker')) {
    return { url: 'https://cdn.simpleicons.org/docker', bgColor: '#2496ED', textColor: '#FFFFFF' };
  }
  
  // Web Servers & Proxies
  if (product.includes('nginx')) {
    return { url: 'https://cdn.simpleicons.org/nginx', bgColor: '#009639', textColor: '#FFFFFF' };
  }
  if (product.includes('apache') && !product.includes('kafka') && !product.includes('spark')) {
    return { url: 'https://cdn.simpleicons.org/apache', bgColor: '#D22128', textColor: '#FFFFFF' };
  }
  
  // Frontend Frameworks & CDN
  if (product.includes('react')) {
    return { url: 'https://cdn.simpleicons.org/react', bgColor: '#61DAFB', textColor: '#000000' };
  }
  if (product.includes('next.js') || product.includes('nextjs')) {
    return { url: 'https://cdn.simpleicons.org/nextdotjs', bgColor: '#000000', textColor: '#FFFFFF' };
  }
  if (product.includes('vue')) {
    return { url: 'https://cdn.simpleicons.org/vuedotjs', bgColor: '#4FC08D', textColor: '#FFFFFF' };
  }
  if (product.includes('angular')) {
    return { url: 'https://cdn.simpleicons.org/angular', bgColor: '#DD0031', textColor: '#FFFFFF' };
  }
  if (product.includes('cloudflare')) {
    return { url: 'https://cdn.simpleicons.org/cloudflare', bgColor: '#F38020', textColor: '#FFFFFF' };
  }
  
  // User/Generic
  if (product.includes('user')) {
    return { url: '', bgColor: '#6366F1', textColor: '#FFFFFF' };
  }
  
  // Default
  return { url: '', bgColor: '#64748B', textColor: '#FFFFFF' };
};

export const getNodeTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    compute: '#F59E0B',
    storage: '#10B981',
    database: '#3B82F6',
    messaging: '#8B5CF6',
    analytics: '#EC4899',
    frontend: '#06B6D4',
    gateway: '#F97316',
    user: '#6366F1',
    other: '#64748B',
  };
  return colors[type] || colors.other;
};

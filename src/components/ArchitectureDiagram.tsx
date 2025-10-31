import { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  MarkerType,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { getProductIcon, getNodeTypeColor } from './ProductIcons';
import { User } from 'lucide-react';
import dagre from 'dagre';
import { AzureLogo } from './AzureLogo';
import { ComponentDetails } from './ComponentDetails';
import { AnimatePresence } from 'motion/react';

interface ArchitectureDiagramProps {
  nodes: Array<{
    id: string;
    label: string;
    product: string;
    type: string;
    config?: {
      tier?: string;
      skuName?: string;
      region?: string;
      rationale?: string;
      estimatedMonthlyCost?: number;
      specs?: Record<string, any>;
      features?: string[];
      useCases?: string[];
      technicalDetails?: string;
      bestPractices?: string[];
      documentation?: string;
    };
  }>;
  edges: Array<{
    source: string;
    target: string;
    label?: string;
  }>;
}

// Custom node component with product icon
function ProductNode({ data, selected }: any) {
  const iconData = getProductIcon(data.product);
  const typeColor = getNodeTypeColor(data.type);
  
  // Check if this is an Azure component
  const isAzure = data.product.toLowerCase().includes('azure') || 
                  data.product.toLowerCase().includes('microsoft');

  const handleClick = () => {
    console.log(`\n🖱️ Node clicked!`);
    console.log(`Product: "${data.product}"`);
    console.log(`Label: "${data.label}"`);
    console.log(`Has details handler: ${!!data.onDetailsClick}`);
    
    if (data.onDetailsClick) {
      console.log(`✅ Opening component details for ${data.product}`);
      data.onDetailsClick(data.product, data.label, data.nodeId);
    } else {
      console.log(`❌ Details click handler not available`);
    }
  };

  return (
    <div 
      className={`rounded-xl shadow-md border border-gray-300 bg-white p-5 w-[160px] hover:shadow-xl transition-all hover:scale-105 relative cursor-pointer hover:border-blue-500 ${
        selected ? 'ring-4 ring-blue-400 shadow-2xl scale-105' : ''
      }`}
      onClick={handleClick}
      title="Click to view component details"
    >
      {/* Handles for connections - CRITICAL for edges to work */}
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3" />
      
      {/* Azure Cloud Provider Badge */}
      {isAzure && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center">
          <AzureLogo className="w-5 h-5" />
        </div>
      )}
      
      <div className="flex flex-col items-center gap-2.5">
        {/* Product Icon */}
        <div 
          className="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm"
          style={{ backgroundColor: iconData.bgColor }}
        >
          {iconData.url ? (
            <img 
              src={iconData.url} 
              alt={data.product}
              className="w-10 h-10"
              onError={(e) => {
                // Fallback if icon fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <User className="w-7 h-7" style={{ color: iconData.textColor }} />
          )}
        </div>
        
        {/* Label */}
        <div className="text-center w-full">
          <div className="text-sm mb-0.5 truncate">{data.label}</div>
          <div className="text-xs text-muted-foreground truncate">{data.product}</div>
        </div>
        
        {/* Pricing Badge (if available) */}
        {data.pricing && data.pricing.monthlyEstimate !== undefined && data.pricing.monthlyEstimate > 0 && (
          <div className="px-2 py-0.5 rounded-md text-xs bg-blue-100 text-blue-700 border border-blue-300">
            ~${data.pricing.monthlyEstimate.toFixed(0)}/mo
          </div>
        )}
        
        {/* Type Badge */}
        <div 
          className="px-2.5 py-0.5 rounded-full text-xs text-white"
          style={{ backgroundColor: typeColor }}
        >
          {data.type}
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  productNode: ProductNode,
};

// Layout nodes using dagre
function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: 'TB', 
    nodesep: 150, 
    ranksep: 200,
    edgesep: 50,
  });

  const nodeWidth = 180;
  const nodeHeight = 180;

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

function ArchitectureDiagramInner({ nodes: inputNodes, edges: inputEdges, currency = 'USD' }: ArchitectureDiagramProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState({ product: '', label: '' });
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const reactFlowInstance = useReactFlow();

  console.log('=== ArchitectureDiagram Render ===');
  console.log('Input nodes:', inputNodes);
  console.log('Input edges:', inputEdges);
  console.log('Edges count:', inputEdges?.length);
  
  const handleDetailsClick = useCallback((product: string, label: string, nodeId: string) => {
    console.log(`\n📦 Opening details for: ${nodeId}`);
    
    setSelectedProduct({ product, label });
    setSelectedNodeId(nodeId);
    setShowDetails(true);
  }, []);

  // Step 1: Convert to React Flow format
  const rfNodes: Node[] = useMemo(() => {
    return inputNodes.map((node) => {
      // Log if node has AI-generated config
      if (node.config) {
        console.log(`  ⚙️ Node ${node.id} has AI config:`, node.config);
      }
      
      return {
        id: node.id,
        type: 'productNode',
        position: { x: 0, y: 0 }, // Will be set by layout
        data: {
          nodeId: node.id,
          label: node.label,
          product: node.product,
          type: node.type,
          config: node.config, // Pass AI-generated config
          onDetailsClick: handleDetailsClick,
        },
      };
    });
  }, [inputNodes, handleDetailsClick]);

  // Step 2: Convert edges with smoothstep to avoid overlapping
  const rfEdges: Edge[] = useMemo(() => {
    return inputEdges.map((edge, index) => {
      const e = {
        id: `edge-${edge.source}-${edge.target}-${index}`,
        source: edge.source,
        target: edge.target,
        label: edge.label || '',
        type: 'smoothstep',
        animated: true,
        style: { 
          stroke: '#3b82f6', 
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#3b82f6',
          width: 20,
          height: 20,
        },
      };
      console.log(`Created edge ${index}:`, e);
      return e;
    });
  }, [inputEdges]);

  console.log('React Flow nodes:', rfNodes);
  console.log('React Flow edges:', rfEdges);
  console.log('React Flow edges count:', rfEdges.length);

  // Step 3: Apply layout - memoized to avoid recalculation
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getLayoutedElements(rfNodes, rfEdges);
  }, [rfNodes, rfEdges]);

  console.log('After layout - nodes:', layoutedNodes);
  console.log('After layout - edges:', layoutedEdges);
  console.log('After layout - edges count:', layoutedEdges.length);

  // Center the selected node when details panel is shown
  useEffect(() => {
    if (showDetails && selectedNodeId && reactFlowInstance) {
      setTimeout(() => {
        const node = layoutedNodes.find(n => n.id === selectedNodeId);
        if (node) {
          reactFlowInstance.setCenter(
            node.position.x + 90, // Offset by half node width
            node.position.y + 90, // Offset by half node height
            { zoom: 1, duration: 800 }
          );
        }
      }, 300);
    }
  }, [showDetails, selectedNodeId, layoutedNodes, reactFlowInstance]);

  // Mark selected nodes - memoized to update when selection changes
  const nodesWithSelection = useMemo(() => {
    return layoutedNodes.map(node => ({
      ...node,
      selected: node.id === selectedNodeId,
    }));
  }, [layoutedNodes, selectedNodeId]);

  // Step 4: Render with ReactFlow
  return (
    <>
      <div className="w-full h-full bg-white rounded-lg border border-gray-200 shadow-sm relative">
        <ReactFlow
          nodes={nodesWithSelection}
          edges={layoutedEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#3b82f6', strokeWidth: 2 },
          }}
          attributionPosition="bottom-left"
        >
          <Background variant={BackgroundVariant.Dots} />
          <Controls />
        </ReactFlow>

        {/* Side Panel for Component Details */}
        <AnimatePresence>
          {showDetails && (() => {
            const selectedNode = inputNodes.find(n => n.id === selectedNodeId);
            return (
              <ComponentDetails
                product={selectedProduct.product}
                label={selectedProduct.label}
                nodeId={selectedNodeId}
                aiConfig={selectedNode?.config}
                onClose={() => setShowDetails(false)}
              />
            );
          })()}
        </AnimatePresence>
      </div>
    </>
  );
}

// Wrapper to provide ReactFlow context
export function ArchitectureDiagram(props: ArchitectureDiagramProps) {
  return (
    <ReactFlowProvider>
      <ArchitectureDiagramInner {...props} />
    </ReactFlowProvider>
  );
}

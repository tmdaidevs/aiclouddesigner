import ReactFlow, { Node, Edge, MarkerType, Background, BackgroundVariant, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

// Simple test to verify edges work
export function TestDiagram() {
  const nodes: Node[] = [
    {
      id: 'node1',
      type: 'default',
      position: { x: 100, y: 100 },
      data: { label: 'Node 1' },
    },
    {
      id: 'node2',
      type: 'default',
      position: { x: 300, y: 100 },
      data: { label: 'Node 2' },
    },
    {
      id: 'node3',
      type: 'default',
      position: { x: 200, y: 250 },
      data: { label: 'Node 3' },
    },
  ];

  const edges: Edge[] = [
    {
      id: 'edge1',
      source: 'node1',
      target: 'node2',
      label: 'Test Edge 1',
      animated: true,
      style: { stroke: '#ff0000', strokeWidth: 3 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#ff0000',
      },
    },
    {
      id: 'edge2',
      source: 'node2',
      target: 'node3',
      label: 'Test Edge 2',
      animated: true,
      style: { stroke: '#00ff00', strokeWidth: 3 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#00ff00',
      },
    },
    {
      id: 'edge3',
      source: 'node1',
      target: 'node3',
      label: 'Test Edge 3',
      animated: true,
      style: { stroke: '#0000ff', strokeWidth: 3 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#0000ff',
      },
    },
  ];

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

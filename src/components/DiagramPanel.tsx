import { motion } from 'motion/react';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import { TestDiagram } from './TestDiagram';
import { Network } from 'lucide-react';
import { MenuBar } from './MenuBar';

interface DiagramPanelProps {
  nodes: Array<{
    id: string;
    label: string;
    product: string;
    type: string;
  }> | null;
  edges: Array<{
    source: string;
    target: string;
    label?: string;
  }>;
  onConfigurationsChange?: (configs: Record<string, any>) => void;
  showTestDiagram?: boolean;
  hasArchitecture?: boolean;
  onNewArchitecture?: () => void;
  onExportTerraform?: () => void;
  onExportBicep?: () => void;
  onExportARM?: () => void;
  onExportPNG?: () => void;
  onExportSVG?: () => void;
  onToggleTestDiagram?: () => void;
  isExporting?: boolean;
}

export function DiagramPanel({ 
  nodes, 
  edges, 
  onConfigurationsChange, 
  showTestDiagram = false,
  hasArchitecture = false,
  onNewArchitecture = () => {},
  onExportTerraform = () => {},
  onExportBicep = () => {},
  onExportARM = () => {},
  onExportPNG = () => {},
  onExportSVG = () => {},
  onToggleTestDiagram = () => {},
  isExporting = false,
}: DiagramPanelProps) {
  console.log('DiagramPanel received:', { nodes, edges });

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="p-6 pb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Network className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg">Architecture Diagram</h2>
            <p className="text-sm text-muted-foreground">Interactive cloud architecture visualization</p>
          </div>
        </div>
        <MenuBar
          hasArchitecture={hasArchitecture}
          onNewArchitecture={onNewArchitecture}
          onExportTerraform={onExportTerraform}
          onExportBicep={onExportBicep}
          onExportARM={onExportARM}
          onExportPNG={onExportPNG}
          onExportSVG={onExportSVG}
          showTestDiagram={showTestDiagram}
          onToggleTestDiagram={onToggleTestDiagram}
          isExporting={isExporting}
        />
      </div>

      {/* Diagram Area */}
      <div className="flex-1 p-6">
        {showTestDiagram ? (
          <div className="h-full">
            <TestDiagram />
          </div>
        ) : nodes && nodes.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="h-full"
          >
            <ArchitectureDiagram nodes={nodes} edges={edges} />
          </motion.div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="inline-block mb-6"
              >
                <Network className="w-24 h-24 text-gray-300" />
              </motion.div>
              <h3 className="mb-2 text-gray-600">No Architecture Yet</h3>
              <p className="text-muted-foreground">
                Describe your system requirements in the chat panel to generate a professional 
                multi-cloud architecture diagram with real product logos.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

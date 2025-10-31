import { useState } from 'react';
import { DiagramPanel } from './components/DiagramPanel';
import { ChatPanel } from './components/ChatPanel';
import { MenuBar } from './components/MenuBar';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';

interface Architecture {
  id: string;
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
      specs?: Record<string, any>;
    };
  }>;
  edges: Array<{
    source: string;
    target: string;
    label?: string;
  }>;
  description: string;
  components: string[];
}

export default function App() {
  const [architecture, setArchitecture] = useState<Architecture | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configurations, setConfigurations] = useState<Record<string, any>>({});
  const [showChat, setShowChat] = useState(true);
  const [showTestDiagram, setShowTestDiagram] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleGenerate = async (requirements: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f62db522/api/generate-architecture`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ requirements }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate architecture');
      }

      const data = await response.json();
      console.log('=== RECEIVED ARCHITECTURE DATA ===');
      console.log('Full data:', JSON.stringify(data, null, 2));
      console.log('Nodes count:', data.nodes?.length);
      console.log('Edges count:', data.edges?.length);
      
      // Log config info
      data.nodes?.forEach((node: any) => {
        if (node.config) {
          console.log(`⚙️ ${node.label} config:`, node.config);
        }
      });
      
      // Validate edges
      if (data.edges && data.edges.length > 0) {
        console.log('✅ Edges received from backend');
        data.edges.forEach((edge: any, i: number) => {
          console.log(`  Edge ${i}: ${edge.source} -> ${edge.target} (${edge.label})`);
        });
      } else {
        console.warn('⚠️ NO EDGES IN RESPONSE!');
      }
      
      setArchitecture(data);
      
      // Show success toast
      toast.success('Architecture Generated', {
        description: `Created ${data.nodes?.length || 0} components`,
      });
    } catch (err) {
      console.error('Error generating architecture:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      toast.error('Generation Failed', {
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportIaC = async (format: 'terraform' | 'bicep' | 'arm') => {
    if (!architecture?.nodes || architecture.nodes.length === 0) {
      toast.error('No Architecture', {
        description: 'Please generate an architecture first.',
      });
      return;
    }

    setIsExporting(true);

    try {
      console.log(`Generating ${format} template...`);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f62db522/api/generate-iac`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            nodes: architecture.nodes,
            edges: architecture.edges,
            format,
            configurations: configurations,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate template');
      }

      const data = await response.json();
      
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
        description: `Downloaded ${data.filename} (${(data.size / 1024).toFixed(1)} KB)`,
        duration: 4000,
      });

    } catch (error) {
      console.error(`Error generating ${format}:`, error);
      toast.error('Generation Failed', {
        description: error instanceof Error ? error.message : 'Failed to generate template',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportImage = (format: 'png' | 'svg') => {
    toast.info('Coming Soon', {
      description: `Export as ${format.toUpperCase()} will be available soon.`,
    });
  };

  const handleNewArchitecture = () => {
    if (architecture && !confirm('Clear current architecture and start new?')) {
      return;
    }
    setArchitecture(null);
    setConfigurations({});
    toast.success('Cleared', { description: 'Ready for new architecture' });
  };

  return (
    <>
      <Toaster />
      <div className="h-screen flex flex-col bg-gray-100">

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-6 mt-4"
            >
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError(null)}
                    className="h-auto p-1 hover:bg-transparent"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Diagram */}
          <div className="flex-1 overflow-hidden">
            <DiagramPanel 
              nodes={architecture?.nodes || null} 
              edges={architecture?.edges || []}
              onConfigurationsChange={setConfigurations}
              showTestDiagram={showTestDiagram}
              hasArchitecture={architecture !== null}
              onNewArchitecture={handleNewArchitecture}
              onExportTerraform={() => handleExportIaC('terraform')}
              onExportBicep={() => handleExportIaC('bicep')}
              onExportARM={() => handleExportIaC('arm')}
              onExportPNG={() => handleExportImage('png')}
              onExportSVG={() => handleExportImage('svg')}
              onToggleTestDiagram={() => setShowTestDiagram(!showTestDiagram)}
              isExporting={isExporting}
            />
          </div>

          {/* Right Panel - Chat */}
          {showChat && (
            <div className="w-[480px] flex-shrink-0 overflow-hidden">
              <ChatPanel
                onGenerate={handleGenerate}
                isLoading={isLoading}
                components={architecture?.components}
                description={architecture?.description}
                architecture={architecture}
                onArchitectureUpdate={setArchitecture}
                onClear={() => {
                  setArchitecture(null);
                  setConfigurations({});
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

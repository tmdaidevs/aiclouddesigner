import { X, Sparkles, Info, Check, ExternalLink, BookOpen, Zap, Shield, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { motion } from 'motion/react';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';

interface ComponentDetailsProps {
  product: string;
  label: string;
  nodeId: string;
  aiConfig?: {
    tier?: string;
    skuName?: string;
    region?: string;
    rationale?: string;
    specs?: Record<string, any>;
    features?: string[];
    useCases?: string[];
    technicalDetails?: string;
    bestPractices?: string[];
    documentation?: string;
  };
  onClose: () => void;
}

export function ComponentDetails({ 
  product, 
  label, 
  nodeId,
  aiConfig, 
  onClose,
}: ComponentDetailsProps) {
  const hasConfig = aiConfig && Object.keys(aiConfig).length > 0;

  // Extract Azure service name for documentation link
  const getDocumentationUrl = (productName: string) => {
    const serviceName = productName.toLowerCase().replace(/\s+/g, '-');
    if (productName.includes('Azure')) {
      return `https://learn.microsoft.com/en-us/azure/${serviceName}`;
    }
    return null;
  };

  const docUrl = getDocumentationUrl(product);

  return (
    <motion.div
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -400, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="absolute left-0 top-0 bottom-0 w-[400px] bg-white border-r border-gray-200 shadow-xl z-10"
    >
      <ScrollArea className="h-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 sticky top-0 z-10">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg">Component Details</h3>
                <p className="text-xs text-gray-600 mt-0.5">{label}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600">{product}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!hasConfig && (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">
                No detailed information available for this component.
              </p>
            </div>
          )}

          {hasConfig && (
            <>
              {/* Why This Component */}
              {aiConfig.rationale && (
                <div className="space-y-3">
                  <h4 className="text-sm text-gray-700">
                    Why This Component
                  </h4>
                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {aiConfig.rationale}
                    </p>
                  </div>
                </div>
              )}

              {/* Technical Details */}
              {aiConfig.technicalDetails && (
                <div className="space-y-3">
                  <h4 className="text-sm text-gray-700">
                    Technical Details
                  </h4>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {aiConfig.technicalDetails}
                    </p>
                  </div>
                </div>
              )}

              {/* Configuration */}
              <div className="space-y-3">
                <h4 className="text-sm text-gray-700">
                  Configuration
                </h4>
                <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-200">
                  {aiConfig.tier && (
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-sm text-gray-600">Service Tier</span>
                      <Badge variant="secondary">{aiConfig.tier}</Badge>
                    </div>
                  )}
                  {aiConfig.skuName && (
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-sm text-gray-600">SKU / Size</span>
                      <Badge variant="secondary">{aiConfig.skuName}</Badge>
                    </div>
                  )}
                  {aiConfig.region && (
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-sm text-gray-600">Region</span>
                      <Badge variant="secondary">{aiConfig.region}</Badge>
                    </div>
                  )}
                  {aiConfig.specs && Object.keys(aiConfig.specs).length > 0 && (
                    <>
                      {Object.entries(aiConfig.specs).map(([key, value]) => (
                        <div key={key} className="p-3 flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-sm text-gray-900">{String(value)}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Key Features */}
              {aiConfig.features && aiConfig.features.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm text-gray-700">
                    Key Features
                  </h4>
                  <div className="space-y-2">
                    {aiConfig.features.map((feature, idx) => (
                      <div key={idx} className="bg-green-50 rounded-lg border border-green-200 p-3">
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Use Cases */}
              {aiConfig.useCases && aiConfig.useCases.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm text-gray-700">
                    Use Cases
                  </h4>
                  <div className="space-y-2">
                    {aiConfig.useCases.map((useCase, idx) => (
                      <div key={idx} className="bg-orange-50 rounded-lg border border-orange-200 p-3">
                        <p className="text-sm text-gray-700">{useCase}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Best Practices */}
              {aiConfig.bestPractices && aiConfig.bestPractices.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm text-gray-700">
                    Best Practices
                  </h4>
                  <div className="space-y-2">
                    {aiConfig.bestPractices.map((practice, idx) => (
                      <div key={idx} className="bg-indigo-50 rounded-lg border border-indigo-200 p-3">
                        <span className="text-sm text-gray-700">{practice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Documentation Link */}
              <div className="space-y-3">
                {docUrl ? (
                  <a
                    href={docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" className="w-full">
                      Official Documentation
                    </Button>
                  </a>
                ) : (
                  <p className="text-xs text-gray-500 italic">
                    Documentation link not available
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
}

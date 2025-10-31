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
import { toast } from 'sonner@2.0.3';

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

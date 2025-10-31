import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarShortcut,
} from './ui/menubar';
import { 
  FileIcon, 
  PlusIcon, 
  SaveIcon, 
  DownloadIcon, 
  UploadIcon,
  EyeIcon,
  EyeOffIcon,
  ZoomInIcon,
  ZoomOutIcon,
  MaximizeIcon,
  PanelRightIcon,
  WrenchIcon,
  Trash2Icon,
  CheckCircleIcon,
  HelpCircleIcon,
  BookOpenIcon,
  KeyboardIcon,
  InfoIcon,
  UserCircleIcon,
  FileCode2Icon,
  ImageIcon,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from './ui/dropdown-menu';

interface MenuBarProps {
  hasArchitecture: boolean;
  onNewArchitecture: () => void;
  onExportTerraform: () => void;
  onExportBicep: () => void;
  onExportARM: () => void;
  onExportPNG?: () => void;
  onExportSVG?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onToggleChat?: () => void;
  showTestDiagram?: boolean;
  onToggleTestDiagram?: () => void;
  isExporting?: boolean;
}

export function MenuBar({
  hasArchitecture,
  onNewArchitecture,
  onExportTerraform,
  onExportBicep,
  onExportARM,
  onExportPNG,
  onExportSVG,
  onZoomIn,
  onZoomOut,
  onFitView,
  onToggleChat,
  showTestDiagram = false,
  onToggleTestDiagram,
  isExporting = false,
}: MenuBarProps) {
  
  return (
    <div className="border-b border-gray-200 bg-white px-4 py-2">
      <div className="flex items-center justify-between pl-[60px]">
        <Menubar className="border-none shadow-none bg-transparent p-0 h-auto">
        {/* File Menu */}
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={onNewArchitecture}>
              <PlusIcon />
              New Architecture
              <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem
              onClick={() => {
                toast.info('Coming Soon', {
                  description: 'Save architecture functionality will be available soon.',
                });
              }}
            >
              <SaveIcon />
              Save Architecture
              <MenubarShortcut>⌘S</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        {/* View Menu */}
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={onZoomIn}>
              <ZoomInIcon />
              Zoom In
              <MenubarShortcut>⌘+</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={onZoomOut}>
              <ZoomOutIcon />
              Zoom Out
              <MenubarShortcut>⌘-</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={onFitView}>
              <MaximizeIcon />
              Fit to Screen
              <MenubarShortcut>⌘0</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={onToggleChat}>
              <PanelRightIcon />
              Toggle Chat Panel
              <MenubarShortcut>⌘B</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        {/* Tools Menu */}
        <MenubarMenu>
          <MenubarTrigger>Tools</MenubarTrigger>
          <MenubarContent>
            <MenubarItem
              disabled={!hasArchitecture}
              onClick={onNewArchitecture}
              variant="destructive"
            >
              <Trash2Icon />
              Clear Architecture
            </MenubarItem>
            <MenubarItem
              disabled={!hasArchitecture}
              onClick={() => {
                toast.success('Validation Complete', {
                  description: 'Architecture appears to be valid!',
                });
              }}
            >
              <CheckCircleIcon />
              Validate Architecture
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        {/* Help Menu */}
        <MenubarMenu>
          <MenubarTrigger>Help</MenubarTrigger>
          <MenubarContent>
            <MenubarItem
              onClick={() => {
                toast.info('Documentation', {
                  description: 'Documentation will be available soon.',
                });
              }}
            >
              <BookOpenIcon />
              Documentation
            </MenubarItem>
            <MenubarItem
              onClick={() => {
                toast.info('Keyboard Shortcuts', {
                  description: 'Keyboard shortcuts guide coming soon.',
                });
              }}
            >
              <KeyboardIcon />
              Keyboard Shortcuts
              <MenubarShortcut>⌘/</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem
              onClick={() => {
                toast.info('About', {
                  description: 'AI Architecture Generator v1.0',
                });
              }}
            >
              <InfoIcon />
              About
            </MenubarItem>
            <MenubarItem
              onClick={() => {
                toast.info('Profile Settings', {
                  description: 'Profile settings coming soon.',
                });
              }}
            >
              <UserCircleIcon />
              Profile Settings
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      {/* Right Side Controls */}
      <div className="flex items-center gap-2">
        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={!hasArchitecture || isExporting}>
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <DownloadIcon className="w-4 h-4 mr-2" />
              )}
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Export Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Infrastructure as Code */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FileCode2Icon className="w-4 h-4 mr-2" />
                Infrastructure as Code
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={onExportTerraform}>
                  <FileCode2Icon className="w-4 h-4 mr-2" />
                  Terraform (.tf)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportBicep}>
                  <FileCode2Icon className="w-4 h-4 mr-2" />
                  Bicep (.bicep)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportARM}>
                  <FileCode2Icon className="w-4 h-4 mr-2" />
                  ARM Template (.json)
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            
            <DropdownMenuSeparator />
            
            {/* Image Export */}
            <DropdownMenuItem onClick={onExportPNG}>
              <ImageIcon className="w-4 h-4 mr-2" />
              Export as PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportSVG}>
              <ImageIcon className="w-4 h-4 mr-2" />
              Export as SVG
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    </div>
  );
}

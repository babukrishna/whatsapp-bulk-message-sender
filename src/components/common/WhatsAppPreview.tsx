import React from 'react';
import { Contact } from '../../types';
import { CheckCheck, ExternalLink, Copy, Check, Image as ImageIcon } from 'lucide-react';

interface WhatsAppPreviewProps {
  contactName: string;
  contactPhone?: string;
  messageText: string;
  imageUrl?: string | null;
  imageName?: string;
  onCopy?: () => void;
  showControls?: boolean;
}

export const WhatsAppPreview: React.FC<WhatsAppPreviewProps> = ({
  contactName,
  contactPhone,
  messageText,
  imageUrl,
  imageName,
  onCopy,
  showControls = true,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    if (onCopy) onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to format WhatsApp markdown (*bold*, _italic_, ~strike~, `code`)
  const formatWhatsAppMarkdown = (content: string) => {
    const markdownRegex = /(\*[^*\n\r]+\*|_[^_\n\r]+_|~[^~\n\r]+~|`[^`\n\r]+`)/g;
    const tokens = content.split(markdownRegex);

    return tokens.map((token, idx) => {
      if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
        return <strong key={idx} className="font-bold text-slate-950">{token.slice(1, -1)}</strong>;
      }
      if (token.startsWith('_') && token.endsWith('_') && token.length > 2) {
        return <em key={idx} className="italic">{token.slice(1, -1)}</em>;
      }
      if (token.startsWith('~') && token.endsWith('~') && token.length > 2) {
        return <del key={idx} className="line-through opacity-80">{token.slice(1, -1)}</del>;
      }
      if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
        return <code key={idx} className="bg-black/5 px-1 py-0.5 rounded font-mono text-[12px]">{token.slice(1, -1)}</code>;
      }
      return token;
    });
  };

  // Format message text with links and WhatsApp formatting
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      // Regex for URLs
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = line.split(urlRegex);

      return (
        <React.Fragment key={lIdx}>
          {parts.map((part, pIdx) => {
            if (part.match(urlRegex)) {
              return (
                <a
                  key={pIdx}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline break-all inline-flex items-center gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {part}
                  <ExternalLink className="w-2.5 h-2.5 inline" />
                </a>
              );
            }
            return <React.Fragment key={pIdx}>{formatWhatsAppMarkdown(part)}</React.Fragment>;
          })}
          {lIdx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  // Get initials for avatar
  const initials = contactName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || 'RM';

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-[#efeae2] flex flex-col">
      {/* WhatsApp Chat Header */}
      <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shadow-inner border border-emerald-500/40">
            {initials}
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight text-white flex items-center gap-2">
              <span>{contactName}</span>
              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-emerald-800/80 text-emerald-200">
                WhatsApp
              </span>
            </div>
            <div className="text-xs text-emerald-200/90 leading-tight">
              {contactPhone ? contactPhone : 'Recipe Mantra Customer'}
            </div>
          </div>
        </div>

        {showControls && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs bg-emerald-700/80 hover:bg-emerald-600 text-white px-2.5 py-1.5 rounded-lg border border-emerald-500/50 transition-colors shadow-sm"
            title="Copy message to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-200" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Text</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* WhatsApp Message Body / Chat Bubble */}
      <div 
        className="p-4 overflow-y-auto max-h-[460px] flex flex-col space-y-3"
        style={{
          backgroundImage: `radial-gradient(#d1d7db 1px, transparent 1px)`,
          backgroundSize: '18px 18px',
        }}
      >
        <div className="flex justify-center my-1">
          <span className="bg-[#ffffffcc] backdrop-blur-xs text-[11px] font-medium text-slate-600 px-3 py-0.5 rounded-md shadow-xs border border-slate-200/60 uppercase tracking-wide">
            Today
          </span>
        </div>

        {/* Outgoing Message Bubble (Right-aligned, WhatsApp green) */}
        <div className="self-end max-w-[92%] sm:max-w-[85%] bg-[#d9fdd3] text-slate-900 rounded-2xl rounded-tr-xs p-3 shadow-sm border border-[#c4e6be] relative space-y-2">
          
          {/* Optional Catalogue Image Card inside Bubble */}
          {imageUrl && (
            <div className="rounded-xl overflow-hidden bg-white/70 border border-emerald-200/80 p-1.5 mb-2 shadow-xs">
              <div className="relative group max-h-56 overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt={imageName || 'Recipe Mantra Catalogue'}
                  className="w-full h-auto object-cover max-h-56 rounded-md hover:scale-102 transition-transform duration-200"
                />
              </div>
              <div className="pt-1.5 px-1 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 truncate font-medium text-slate-700">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                  {imageName || 'Catalogue Image'}
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-medium">
                  Attach in WhatsApp
                </span>
              </div>
            </div>
          )}

          {/* Text Message */}
          <div className="text-[13.5px] leading-relaxed text-slate-800 whitespace-pre-wrap font-sans select-text">
            {renderFormattedText(messageText)}
          </div>

          {/* Time & Read Receipts (double blue ticks) */}
          <div className="flex items-center justify-end gap-1 text-[10.5px] text-slate-500 pt-1 -mb-1">
            <span>Just now</span>
            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
          </div>
        </div>
      </div>
    </div>
  );
};

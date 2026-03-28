import { useTranslation } from 'react-i18next';
import { CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { FLAGS, LANGUAGES } from './LanguageFlags';

interface LanguageSelectorProps {
  className?: string;
  align?: 'start' | 'center' | 'end';
  onChange?: (langCode: string) => void;
}

export function LanguageSelector({ className, align = 'end', onChange }: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    onChange?.(langCode);
  };

  const currentLangCode = (i18n.language || 'en').split('-')[0];
  const currentLang = LANGUAGES.find(l => l.code === currentLangCode) || LANGUAGES[0];
  const Flag = FLAGS[currentLang.code] || FLAGS.en;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn("h-9 px-2.5 gap-2.5 hover:bg-muted rounded-xl group transition-all border border-transparent hover:border-border/50", className)}
        >
          <div className="flex items-center gap-2 shadow-sm ring-1 ring-border/10 rounded-[2px] overflow-hidden">
            <Flag size={18} />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44 animate-in fade-in zoom-in-95 duration-200 p-1.5 rounded-2xl shadow-elevated border-border/40 backdrop-blur-md">
        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 px-3 py-2">
          {t('common.language', 'Language')}
        </DropdownMenuLabel>
        {LANGUAGES.map((lang) => {
          const LangFlag = FLAGS[lang.code];
          const isActive = i18n.language.startsWith(lang.code);
          
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all rounded-xl mb-0.5 last:mb-0",
                isActive 
                  ? "bg-primary/10 text-primary font-semibold shadow-sm" 
                  : "hover:bg-muted text-foreground/80 hover:text-foreground"
              )}
            >
              <div className="shrink-0 shadow-sm ring-1 ring-border/20 rounded-[2px] overflow-hidden">
                <LangFlag size={18} />
              </div>
              <span className="text-[13px] flex-1">{lang.label}</span>
              {isActive && <CheckCheck className="h-3.5 w-3.5 ml-auto text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

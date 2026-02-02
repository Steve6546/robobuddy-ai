import { Code, Lightbulb, Zap, Layout, Shield, FileCode } from 'lucide-react';

const skills = [
  {
    icon: Code,
    title: 'خبير الأكواد',
    description: 'كتابة سكربتات Lua محسّنة لـ Roblox Studio',
  },
  {
    icon: Lightbulb,
    title: 'مخطط المشاريع',
    description: 'تحويل أفكارك إلى خطط عمل قابلة للتنفيذ',
  },
  {
    icon: Zap,
    title: 'تحسين الأداء',
    description: 'تحسين ألعابك لأفضل تجربة للاعبين',
  },
  {
    icon: Layout,
    title: 'تصميم الواجهات',
    description: 'إنشاء واجهات جميلة وسهلة الاستخدام',
  },
  {
    icon: Shield,
    title: 'الأمان',
    description: 'تطبيق بنية خادم-عميل آمنة',
  },
  {
    icon: FileCode,
    title: 'تحليل الملفات',
    description: 'تحليل وتحسين ملفات الكود الموجودة',
  },
];

const quickPrompts = [
  "أنشئ نظام كاميرا سلس للألعاب من منظور الشخص الثالث",
  "ساعدني في إعداد نظام حفظ البيانات",
  "اشرح الفرق بين ReplicatedStorage و ServerScriptService",
  "أنشئ واجهة لوحة المتصدرين مع إحصائيات اللاعبين",
];

interface WelcomeScreenProps {
  onPromptClick: (prompt: string) => void;
}

export const WelcomeScreen = ({ onPromptClick }: WelcomeScreenProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-full">
      <div className="max-w-2xl w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-foreground shadow-glow-lg animate-float">
            <Code className="h-8 w-8 text-background" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Roblox Studio Expert
          </h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            مساعدك الذكي لبناء تجارب رائعة في Roblox
          </p>
        </div>

        {/* Skills Grid - consistent icon sizing (h-5 w-5) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {skills.map((skill) => (
            <div
              key={skill.title}
              className="p-4 rounded-xl bg-card border border-border hover:border-foreground/20 transition-all duration-300 group"
            >
              <skill.icon className="h-5 w-5 text-foreground mb-3 group-hover:scale-110 transition-transform" strokeWidth={2} />
              <h3 className="font-medium text-foreground text-sm mb-1">
                {skill.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {skill.description}
              </p>
            </div>
          ))}
        </div>

        {/* Quick Prompts */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground text-center">
            جرب السؤال عن:
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => onPromptClick(prompt)}
                className="px-3 py-2 text-sm bg-muted hover:bg-accent text-foreground rounded-lg border border-border hover:border-foreground/20 transition-all duration-200"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

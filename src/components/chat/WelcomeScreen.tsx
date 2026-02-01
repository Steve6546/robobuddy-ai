import { Code, Lightbulb, Zap, Layout, Shield, FileCode } from 'lucide-react';

const skills = [
  {
    icon: Code,
    title: 'Code Expert',
    description: 'Write optimized Lua scripts for Roblox Studio',
  },
  {
    icon: Lightbulb,
    title: 'Project Planner',
    description: 'Transform your ideas into actionable game plans',
  },
  {
    icon: Zap,
    title: 'Performance',
    description: 'Optimize your games for the best player experience',
  },
  {
    icon: Layout,
    title: 'UI/UX Design',
    description: 'Create beautiful and intuitive game interfaces',
  },
  {
    icon: Shield,
    title: 'Security',
    description: 'Implement secure server-client architecture',
  },
  {
    icon: FileCode,
    title: 'File Analysis',
    description: 'Analyze and improve your existing code files',
  },
];

const quickPrompts = [
  "Create a smooth camera system for a third-person game",
  "Help me set up a data saving system with ProfileService",
  "Explain ReplicatedStorage vs ServerScriptService",
  "Build a leaderboard UI with player stats",
];

interface WelcomeScreenProps {
  onPromptClick: (prompt: string) => void;
}

export const WelcomeScreen = ({ onPromptClick }: WelcomeScreenProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto">
      <div className="max-w-2xl w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-glow-lg animate-float">
            <Code className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">
            Roblox Studio Expert
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Your AI-powered assistant for building amazing Roblox experiences
          </p>
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {skills.map((skill) => (
            <div
              key={skill.title}
              className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 group"
            >
              <skill.icon className="h-6 w-6 text-primary mb-3 group-hover:scale-110 transition-transform" />
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
            Try asking about:
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => onPromptClick(prompt)}
                className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-lg border border-border hover:border-primary/50 transition-all duration-200"
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

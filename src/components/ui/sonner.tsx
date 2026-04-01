import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      dir="rtl"
      position="top-center"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast:
            "group toast w-[380px] max-w-[95vw] rounded-2xl border border-border/60 bg-background/95 px-4 py-3 text-foreground shadow-xl backdrop-blur-sm",
          title: "text-sm font-bold leading-6",
          description: "mt-1 text-sm leading-6 text-muted-foreground",
          closeButton:
            "group-[.toast]:border-border/60 group-[.toast]:bg-background group-[.toast]:text-muted-foreground hover:group-[.toast]:text-foreground",
          success:
            "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
          error:
            "border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-200",
          info: "border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-200",
          warning:
            "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200",
          actionButton:
            "rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground",
          cancelButton:
            "rounded-lg border border-border/60 bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useHomepageContent } from "@/hooks/useSiteContent";
import workshopBg from "@/assets/workshop-bg.jpg";

const schema = z.object({
  name: z.string().trim().min(2, "Введите имя").max(100, "Имя слишком длинное"),
  phone: z.string().trim().min(7, "Введите корректный телефон").max(20, "Телефон слишком длинный"),
  email: z.string().trim().email("Введите корректный email").max(255, "Email слишком длинный").optional().or(z.literal("")),
  subject: z.string().min(1, "Выберите тему обращения"),
  message: z.string().trim().min(10, "Сообщение слишком короткое").max(1000, "Сообщение слишком длинное"),
});

type FormData = z.infer<typeof schema>;

const subjects = [
  "Заказ изделия",
  "Индивидуальный проект",
  "Консультация по материалам",
  "Доставка и оплата",
  "Сотрудничество",
  "Другое",
];

const ContactForm = () => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const content = useHomepageContent();
  const cTitle = content.contact?.title?.trim() || "Оставить заявку";
  const cSubtitle = content.contact?.subtitle?.trim() || "Расскажите о вашем проекте — мы подберём оптимальное решение и рассчитаем стоимость";
  const cConsent = content.contact?.consent?.trim() || "Нажимая кнопку, вы соглашаетесь с обработкой персональных данных";
  const cSubmit = content.contact?.submitLabel?.trim() || "Отправить заявку";
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", email: "", subject: "", message: "" },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    const contact = data.email ? `${data.phone} / ${data.email}` : data.phone;
    const { error } = await supabase.from("contact_requests").insert({
      name: data.name,
      contact,
      subject: data.subject,
      message: data.message,
    });
    setSubmitting(false);
    if (error) {
      toast({
        title: "Не удалось отправить",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Заявка отправлена!",
      description: "Наш менеджер свяжется с вами в течение часа.",
    });
    form.reset();
  };

  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      {/* Workshop background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${content.contact?.bgImage?.trim() || workshopBg})` }}
      />
      <div className="absolute inset-0 bg-black/75" />
      {/* Top fade from dark */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-t from-transparent to-[hsl(0_0%_2%)]" />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-[hsl(0_0%_0%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl text-center mb-3 text-foreground">
            {cTitle}
          </h2>
          <p className="text-center text-muted-foreground mb-10 font-light max-w-md mx-auto">
            {cSubtitle}
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имя *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ваше имя"
                        className="bg-background/10 border-border/50 backdrop-blur-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Телефон *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+7 (999) 123-45-67"
                        type="tel"
                        className="bg-background/10 border-border/50 backdrop-blur-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="mail@example.com"
                        type="email"
                        className="bg-background/10 border-border/50 backdrop-blur-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тема обращения *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background/10 border-border/50 backdrop-blur-sm">
                          <SelectValue placeholder="Выберите тему" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="message" render={({ field }) => (
                <FormItem>
                  <FormLabel>Сообщение *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Опишите, какое изделие вас интересует: размеры, материал, назначение..."
                      rows={5}
                      className="bg-background/10 border-border/50 backdrop-blur-sm resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" size="lg" disabled={submitting} className="w-full rounded-full text-base">
                {submitting ? "Отправка..." : cSubmit}
              </Button>

              <p className="text-center text-xs text-muted-foreground/60">
                {cConsent}
              </p>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;

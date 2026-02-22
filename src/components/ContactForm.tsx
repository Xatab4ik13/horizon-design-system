import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(2, "Введите имя"),
  contact: z.string().min(5, "Введите телефон или email"),
  message: z.string().min(10, "Сообщение слишком короткое"),
});

type FormData = z.infer<typeof schema>;

const ContactForm = () => {
  const { toast } = useToast();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", contact: "", message: "" },
  });

  const onSubmit = (data: FormData) => {
    console.log("Form submitted:", data);
    toast({ title: "Сообщение отправлено!", description: "Мы свяжемся с вами в ближайшее время." });
    form.reset();
  };

  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4 max-w-lg">
        <h2 className="text-3xl md:text-4xl text-center mb-4 text-foreground">
          Обратная связь
        </h2>
        <p className="text-center text-muted-foreground mb-8 font-light">Оставьте заявку и мы свяжемся с вами</p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Имя</FormLabel>
                <FormControl><Input placeholder="Ваше имя" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="contact" render={({ field }) => (
              <FormItem>
                <FormLabel>Телефон или Email</FormLabel>
                <FormControl><Input placeholder="+7 (999) 123-45-67" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="message" render={({ field }) => (
              <FormItem>
                <FormLabel>Сообщение</FormLabel>
                <FormControl><Textarea placeholder="Расскажите, что вас интересует..." rows={4} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" size="lg" className="w-full rounded-full">
              Отправить
            </Button>
          </form>
        </Form>
      </div>
    </section>
  );
};

export default ContactForm;

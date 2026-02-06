/**
 * @fileoverview صفحة سياسة الخصوصية - Privacy Policy Page
 */

import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-foreground">سياسة الخصوصية</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <p className="text-muted-foreground text-sm mb-8">
                آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">1. مقدمة</h2>
              <p className="text-muted-foreground leading-relaxed">
                نحن في Roblox Expert نلتزم بحماية خصوصيتك. توضح سياسة الخصوصية هذه كيفية جمع 
                واستخدام وحماية معلوماتك الشخصية عند استخدام خدمتنا.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2. المعلومات التي نجمعها</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                نجمع أنواعاً مختلفة من المعلومات لتقديم خدمة أفضل لك:
              </p>
              
              <h3 className="text-lg font-medium text-foreground mb-2">معلومات الحساب</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>الاسم وعنوان البريد الإلكتروني (من Google أو Apple)</li>
                <li>صورة الملف الشخصي (إن وجدت)</li>
                <li>معرف المستخدم الفريد</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mb-2">معلومات الاستخدام</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>محادثاتك مع المساعد الذكي</li>
                <li>الأكواد والمرفقات التي ترسلها</li>
                <li>تفضيلات الاستخدام والإعدادات</li>
                <li>معلومات الجهاز والمتصفح</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. كيف نستخدم معلوماتك</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                نستخدم المعلومات التي نجمعها للأغراض التالية:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>تقديم وتحسين خدمة المساعد الذكي</li>
                <li>تخصيص تجربتك وتذكر تفضيلاتك</li>
                <li>تحليل أنماط الاستخدام لتحسين الخدمة</li>
                <li>التواصل معك بشأن التحديثات والتغييرات</li>
                <li>ضمان أمان الخدمة ومنع الاستخدام غير المصرح به</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. تخزين البيانات</h2>
              <p className="text-muted-foreground leading-relaxed">
                يتم تخزين بياناتك بشكل آمن باستخدام تقنيات التشفير الحديثة. نحتفظ ببياناتك طالما 
                أن حسابك نشط أو حسب الحاجة لتقديم الخدمة. يمكنك طلب حذف بياناتك في أي وقت.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. مشاركة البيانات</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                نحن لا نبيع معلوماتك الشخصية. قد نشارك بياناتك فقط في الحالات التالية:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>مع مزودي الخدمات الذين يساعدوننا في تشغيل الخدمة (مثل خدمات الاستضافة)</li>
                <li>عند الاقتضاء بموجب القانون أو لحماية حقوقنا</li>
                <li>بموافقتك الصريحة</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. أمان البيانات</h2>
              <p className="text-muted-foreground leading-relaxed">
                نتخذ إجراءات أمنية مناسبة لحماية معلوماتك من الوصول غير المصرح به أو التعديل 
                أو الكشف أو الإتلاف. تشمل هذه الإجراءات التشفير أثناء النقل والتخزين، 
                والمصادقة الآمنة، والمراقبة المستمرة.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">7. حقوقك</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                لديك الحقوق التالية فيما يتعلق ببياناتك:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>الوصول إلى بياناتك الشخصية</li>
                <li>تصحيح البيانات غير الدقيقة</li>
                <li>طلب حذف بياناتك</li>
                <li>الاعتراض على معالجة بياناتك</li>
                <li>نقل بياناتك إلى خدمة أخرى</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. ملفات تعريف الارتباط</h2>
              <p className="text-muted-foreground leading-relaxed">
                نستخدم ملفات تعريف الارتباط والتقنيات المماثلة لتحسين تجربتك وتذكر تفضيلاتك. 
                يمكنك التحكم في ملفات تعريف الارتباط من خلال إعدادات متصفحك.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">9. خصوصية الأطفال</h2>
              <p className="text-muted-foreground leading-relaxed">
                خدمتنا غير موجهة للأطفال دون سن 13 عاماً. نحن لا نجمع معلومات شخصية 
                من الأطفال دون سن 13 عاماً عن علم. إذا علمنا بجمع معلومات من طفل 
                دون سن 13 عاماً، سنتخذ خطوات لحذفها.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">10. التغييرات على هذه السياسة</h2>
              <p className="text-muted-foreground leading-relaxed">
                قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنخطرك بأي تغييرات 
                جوهرية عن طريق نشر السياسة الجديدة على هذه الصفحة وتحديث تاريخ "آخر تحديث".
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">11. الاتصال بنا</h2>
              <p className="text-muted-foreground leading-relaxed">
                إذا كانت لديك أي أسئلة حول سياسة الخصوصية هذه أو ممارسات البيانات لدينا، 
                يرجى التواصل معنا عبر الخدمة نفسها.
              </p>
            </section>

            <div className="h-8" />
          </div>
        </ScrollArea>
      </main>
    </div>
  );
};

export default Privacy;

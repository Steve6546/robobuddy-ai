/**
 * @fileoverview صفحة شروط الخدمة - Terms of Service Page
 */

import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const Terms = () => {
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
          <h1 className="text-xl font-bold text-foreground">شروط الخدمة</h1>
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
                مرحباً بك في Roblox Expert. باستخدامك لهذه الخدمة، فإنك توافق على الالتزام بشروط الخدمة هذه. 
                يرجى قراءة هذه الشروط بعناية قبل استخدام الخدمة. إذا كنت لا توافق على أي جزء من هذه الشروط، 
                فلا يحق لك استخدام الخدمة.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2. وصف الخدمة</h2>
              <p className="text-muted-foreground leading-relaxed">
                Roblox Expert هو مساعد ذكي متخصص في Roblox Studio، يوفر المساعدة في البرمجة بلغة Lua، 
                تصميم الألعاب، وحل المشكلات التقنية. الخدمة مدعومة بتقنيات الذكاء الاصطناعي المتقدمة.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. حساب المستخدم</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>يجب أن يكون عمرك 13 عاماً أو أكثر لاستخدام هذه الخدمة</li>
                <li>أنت مسؤول عن الحفاظ على أمان حسابك</li>
                <li>يجب تقديم معلومات دقيقة وصحيحة عند التسجيل</li>
                <li>لا يجوز مشاركة بيانات تسجيل الدخول مع الآخرين</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. الاستخدام المقبول</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                عند استخدام الخدمة، توافق على:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>عدم استخدام الخدمة لأي غرض غير قانوني</li>
                <li>عدم محاولة اختراق أو إلحاق الضرر بالخدمة</li>
                <li>عدم إرسال محتوى ضار أو مسيء أو غير لائق</li>
                <li>احترام حقوق الملكية الفكرية للآخرين</li>
                <li>عدم استخدام الخدمة لإنشاء محتوى ينتهك شروط Roblox</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. الملكية الفكرية</h2>
              <p className="text-muted-foreground leading-relaxed">
                جميع المحتويات والعلامات التجارية والشعارات المعروضة على الخدمة هي ملك لأصحابها. 
                الأكواد والمحتوى الذي يتم إنشاؤه بمساعدة الخدمة يظل ملكاً للمستخدم، مع منح الخدمة 
                ترخيصاً غير حصري لاستخدامه لأغراض تحسين الخدمة.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. إخلاء المسؤولية</h2>
              <p className="text-muted-foreground leading-relaxed">
                يتم تقديم الخدمة "كما هي" دون أي ضمانات صريحة أو ضمنية. نحن لا نضمن أن:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                <li>الخدمة ستكون متاحة دائماً أو خالية من الأخطاء</li>
                <li>المعلومات المقدمة ستكون دقيقة أو كاملة دائماً</li>
                <li>الأكواد المقترحة ستعمل في جميع الحالات</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">7. حدود المسؤولية</h2>
              <p className="text-muted-foreground leading-relaxed">
                لن نكون مسؤولين عن أي أضرار مباشرة أو غير مباشرة أو عرضية أو تبعية ناتجة عن 
                استخدام الخدمة أو عدم القدرة على استخدامها، حتى لو تم إبلاغنا بإمكانية حدوث مثل هذه الأضرار.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. التعديلات على الشروط</h2>
              <p className="text-muted-foreground leading-relaxed">
                نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطار المستخدمين بأي تغييرات جوهرية. 
                استمرار استخدام الخدمة بعد التعديلات يعني موافقتك على الشروط الجديدة.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">9. إنهاء الخدمة</h2>
              <p className="text-muted-foreground leading-relaxed">
                نحتفظ بالحق في إنهاء أو تعليق وصولك إلى الخدمة في أي وقت، دون إشعار مسبق، 
                لأي سبب، بما في ذلك انتهاك هذه الشروط.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">10. القانون الواجب التطبيق</h2>
              <p className="text-muted-foreground leading-relaxed">
                تخضع هذه الشروط وتفسر وفقاً للقوانين المعمول بها، دون الإشارة إلى تعارض أحكام القانون.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">11. الاتصال بنا</h2>
              <p className="text-muted-foreground leading-relaxed">
                إذا كانت لديك أي أسئلة حول شروط الخدمة هذه، يرجى التواصل معنا عبر الخدمة نفسها.
              </p>
            </section>

            <div className="h-8" />
          </div>
        </ScrollArea>
      </main>
    </div>
  );
};

export default Terms;

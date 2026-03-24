import { useTranslation } from "@/lib/i18n";
import { Leaf, ShieldCheck, Truck, HeartHandshake } from "lucide-react";

const values = [
  { icon: Leaf, labelAr: "منتجات طبيعية", labelEn: "Natural Products", descAr: "نوفر بذوراً عضوية طبيعية خالية من المواد الكيميائية الضارة.", descEn: "We provide organic, natural seeds free from harmful chemicals." },
  { icon: ShieldCheck, labelAr: "جودة مضمونة", labelEn: "Quality Guaranteed", descAr: "كل منتج يمر بفحص دقيق لضمان أعلى معدلات الإنبات.", descEn: "Every product goes through rigorous testing to ensure the highest germination rates." },
  { icon: Truck, labelAr: "توصيل سريع", labelEn: "Fast Delivery", descAr: "نوصل طلبك إلى باب منزلك بأسرع وقت ممكن.", descEn: "We deliver your order to your doorstep as quickly as possible." },
  { icon: HeartHandshake, labelAr: "خدمة متميزة", labelEn: "Exceptional Service", descAr: "فريقنا جاهز دائماً لمساعدتك واختيار المنتج المناسب.", descEn: "Our team is always ready to help you choose the right product." },
];

export default function About() {
  const { lang } = useTranslation();
  const isAr = lang === "ar";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

      {/* Hero section */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
          <Leaf className="w-4 h-4" />
          {isAr ? "من نحن" : "About Us"}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold font-display">
          {isAr ? "متجر بذور — شغفنا الزراعة" : "Bazour Store — Our Passion is Agriculture"}
        </h1>
      </div>

      {/* Main paragraph */}
      <div className="bg-card border border-border rounded-3xl p-8 md:p-12 space-y-6 text-lg leading-relaxed text-muted-foreground">
        {isAr ? (
          <>
            <p>
              نحن <strong className="text-foreground">متجر بذور</strong>، متجر متخصص في توفير أرقى أصناف البذور والمواد الزراعية والنباتات لعشاق البستنة والزراعة في الأردن والمنطقة العربية. نسعى إلى تقديم منتجات عالية الجودة تضمن لك نتائج مثالية في حديقتك أو مزرعتك.
            </p>
            <p>
              نؤمن أن الزراعة ليست مجرد هواية، بل هي أسلوب حياة يُثري الروح ويُغذي الجسد ويُقرّبنا من الطبيعة. لهذا نحرص على انتقاء كل منتج بعناية فائقة، من بذور الخضروات والأعشاب والأزهار، إلى المواد الزراعية والأدوات اللازمة لكل زارع.
            </p>
            <p>
              فريقنا المتخصص على استعداد دائم لمساعدتك في اختيار البذور المناسبة لبيئتك المحلية، ونضمن لك أعلى معدلات الإنبات وأفضل الأصناف المعتمدة. انضم إلى عائلة بذور واجعل كل زرعة قصة نجاح.
            </p>
          </>
        ) : (
          <>
            <p>
              We are <strong className="text-foreground">Bazour Store</strong>, a specialized store dedicated to providing the finest varieties of seeds, agricultural materials, and plants for gardening and farming enthusiasts in Jordan and the Arab region. We strive to offer high-quality products that guarantee optimal results in your garden or farm.
            </p>
            <p>
              We believe that farming is not just a hobby — it's a lifestyle that enriches the soul, nourishes the body, and connects us to nature. That's why we carefully select every product, from vegetable, herb, and flower seeds to agricultural supplies and tools for every grower.
            </p>
            <p>
              Our specialized team is always ready to help you choose the right seeds for your local environment, ensuring the highest germination rates and the best certified varieties. Join the Bazour family and make every plant a success story.
            </p>
          </>
        )}
      </div>

      {/* Values grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {values.map(({ icon: Icon, labelAr, labelEn, descAr, descEn }) => (
          <div key={labelEn} className="bg-card border border-border rounded-2xl p-6 space-y-3 hover:shadow-md transition-shadow">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-lg">{isAr ? labelAr : labelEn}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{isAr ? descAr : descEn}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Generate human readable responses
function generateResponse(category, intent, data) {
  switch (category) {
    case "projects":
      if (intent === "loss_making") {
        if (data && data.length > 0) {
          return {
            answer: `يوجد ${data.length} مشروع خاسر يحتاج مراجعة`,
            details: data.map((p) => ({
              project: p.name,
              loss: `${p.profit} DZD`,
            })),
          };
        }
        return {
          answer: "لا يوجد مشاريع خاسرة حالياً",
          details: [],
        };
      }
      if (intent === "top_profitable") {
        if (data && data.length > 0) {
          return {
            answer: `أفضل ${data.length} مشاريع من حيث الربح`,
            details: data.map((p) => ({
              project: p.name,
              profit: `${p.profit} DZD`,
              margin: `${p.profit_margin}%`,
            })),
          };
        }
        return {
          answer: "لا توجد مشاريع ربحية حالياً",
          details: [],
        };
      }
      break;
    
    case "finance":
      if (intent === "profit") {
        return {
          answer: `إجمالي الأرباح: ${data?.totalProfit || 0} DZD`,
          details: [],
        };
      }
      if (intent === "expenses") {
        return {
          answer: `إجمالي المصاريف: ${data?.totalExpenses || 0} DZD`,
          details: [],
        };
      }
      break;
    
      case "stock":
       if (intent === "low_stock") {
         if (data && data.length > 0) {
           return {
             answer: `يوجد ${data.length} مواد ناقصة المخزون`,
             details: data.map((p) => ({
               product: p.name,
               available: p.available,
               minStock: p.minimum_quantity,
             })),
           };
         }
         return {
           answer: "المخزون كامل، لا نقص",
           details: [],
         };
       }
       break;
    
    case "clients":
      if (intent === "best_clients") {
        if (data && data.length > 0) {
          return {
            answer: `أفضل ${data.length} عملاء من حيث الربح`,
            details: data.map((c) => ({
              client: c.name,
              profit: `${c.total_profit} DZD`,
            })),
          };
        }
        return {
          answer: "لا توجد بيانات عملاء",
          details: [],
        };
      }
      break;
    
    case "employees":
      if (intent === "available_workers") {
        if (data && data.length > 0) {
          return {
            answer: `يوجد ${data.length} عمال متاحون`,
            details: data.map((e) => ({
              employee: e.name,
              status: e.status,
            })),
          };
        }
        return {
          answer: "جميع العمال مشغولون حالياً",
          details: [],
        };
      }
      break;
    
    default:
      return {
        answer: "عذراً، لم أفهم السؤال. يرجى توضيح طلبك.",
        details: [],
      };
  }
}

module.exports = {
  generateResponse,
};
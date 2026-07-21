// Analyze user question
function analyzeUserQuestion(question) {
  const q = question.toLowerCase();
  
  // Project related
  if (q.includes("مشروع") || q.includes("project") || q.includes("أفضل المشاريع") || q.includes("المشاريع")) {
    if (q.includes("خاسر") || q.includes("loss") || q.includes("خسارة")) {
      return {
        category: "projects",
        intent: "loss_making",
        parameters: {},
      };
    }
    if (q.includes("أفضل") || q.includes("best") || q.includes("أربح")) {
      return {
        category: "projects",
        intent: "top_profitable",
        parameters: {},
      };
    }
    if (q.includes("متأخر") || q.includes("delay") || q.includes("تأخير")) {
      return {
        category: "projects",
        intent: "delayed",
        parameters: {},
      };
    }
    return {
      category: "projects",
      intent: "general",
      parameters: {},
    };
  }
  
  // Finance related
  if (q.includes("ربح") || q.includes("profit") || q.includes("أرباح") || q.includes("finance") || q.includes("مالي")) {
    return {
      category: "finance",
      intent: "profit",
      parameters: {},
    };
  }
  
  if (q.includes("مصرف") || q.includes("expense") || q.includes("نفقة")) {
    return {
      category: "finance",
      intent: "expenses",
      parameters: {},
    };
  }
  
  // Stock related
  if (q.includes("مادة") || q.includes("مخزون") || q.includes("stock") || q.includes("ناقص") || q.includes("نقص")) {
    return {
      category: "stock",
      intent: "low_stock",
      parameters: {},
    };
  }
  
  // Client related
  if (q.includes("عميل") || q.includes("client") || q.includes("أفضل العملاء")) {
    return {
      category: "clients",
      intent: "best_clients",
      parameters: {},
    };
  }
  
  // Employee related
  if (q.includes("عامل") || q.includes("employee") || q.includes("عامل غير مشغول")) {
    return {
      category: "employees",
      intent: "available_workers",
      parameters: {},
    };
  }
  
  return {
    category: "general",
    intent: "unknown",
    parameters: {},
  };
}

module.exports = {
  analyzeUserQuestion,
};
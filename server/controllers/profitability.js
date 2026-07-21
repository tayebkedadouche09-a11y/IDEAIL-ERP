const refreshProjectProfitability = (db, projectId, callback) => {
  const id = Number(projectId);

  if (!id) {
    return callback(null, {
      material_cost: 0,
      labor_cost: 0,
      expense_cost: 0,
      total_cost: 0,
      profit: 0,
      profit_margin: 0,
    });
  }

  db.get(
    "SELECT amount FROM projects WHERE id = ?",
    [id],
    (err, projectRow) => {
      if (err) {
        return callback(err);
      }

      if (!projectRow) {
        return callback(new Error("Project not found"));
      }

      const revenue = Number(projectRow.amount || 0);

      db.get(
        "SELECT COALESCE(SUM(total_cost), 0) AS material_cost FROM project_materials WHERE project_id = ?",
        [id],
        (err, materialRow) => {
          if (err) {
            return callback(err);
          }

          db.get(
            "SELECT COALESCE(SUM(total_cost), 0) AS labor_cost FROM project_workers WHERE project_id = ?",
            [id],
            (err, laborRow) => {
              if (err) {
                return callback(err);
              }

              db.get(
                "SELECT COALESCE(SUM(amount), 0) AS expense_cost FROM project_expenses WHERE project_id = ?",
                [id],
                (err, expenseRow) => {
                  if (err) {
                    return callback(err);
                  }

                  const materialCost = Number(materialRow?.material_cost || 0);
                  const laborCost = Number(laborRow?.labor_cost || 0);
                  const expenseCost = Number(expenseRow?.expense_cost || 0);
                  const totalCost = materialCost + laborCost + expenseCost;
                  const profit = revenue - totalCost;
                  const profitMargin = revenue > 0 ? Number(((profit / revenue) * 100).toFixed(2)) : 0;

                  db.run(
                    `
                    UPDATE projects
                    SET
                      material_cost = ?,
                      labor_cost = ?,
                      expense_cost = ?,
                      total_cost = ?,
                      profit = ?,
                      profit_margin = ?
                    WHERE id = ?
                    `,
                    [materialCost, laborCost, expenseCost, totalCost, profit, profitMargin, id],
                    (updateErr) => {
                      if (updateErr) {
                        return callback(updateErr);
                      }

                      callback(null, {
                        material_cost: materialCost,
                        labor_cost: laborCost,
                        expense_cost: expenseCost,
                        total_cost: totalCost,
                        profit,
                        profit_margin: profitMargin,
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
};

module.exports = {
  refreshProjectProfitability,
};

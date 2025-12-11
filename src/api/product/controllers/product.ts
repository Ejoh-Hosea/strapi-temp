import { factories } from "@strapi/strapi";

export default factories.createCoreController(
  "api::product.product",
  ({ strapi }) => ({
    async find(ctx) {
      const {
        search,
        category,
        company,
        shipping,
        order,
        price,
        page,
        pageSize,
      } = ctx.query || {};

      // ------------------------------
      // BUILD QUERY OBJECT
      // ------------------------------
      const query: any = {
        where: {},
      };

      // search by name
      if (search) {
        query.where.name = { $containsi: search };
      }

      // by category
      if (category && category !== "all") {
        query.where.category = category;
      }

      // by company
      if (company && company !== "all") {
        query.where.company = company;
      }

      // free shipping
      if (shipping === "true") {
        query.where.shipping = true;
      }

      // max price
      if (price) {
        const max = Number(price);
        if (!isNaN(max)) {
          query.where.price = { $lte: max };
        }
      }

      // ------------------------------
      // SORTING
      // ------------------------------
      if (order === "a-z") query.orderBy = { name: "asc" };
      if (order === "z-a") query.orderBy = { name: "desc" };
      if (order === "high") query.orderBy = { price: "desc" };
      if (order === "low") query.orderBy = { price: "asc" };

      // ------------------------------
      // PAGINATION
      // ------------------------------
      const pageNum = Number(page) || 1;
      const sizeNum = Number(pageSize) || 10;

      query.skip = (pageNum - 1) * sizeNum; // OFFSET
      query.take = sizeNum; // LIMIT

      // ------------------------------
      // RUN PRODUCT QUERY
      // ------------------------------
      const products = await strapi.db
        .query("api::product.product")
        .findMany(query);

      // COUNT TOTAL ITEMS FOR META
      const total = await strapi.db.query("api::product.product").count({
        where: query.where,
      });

      // ------------------------------
      // CATEGORIES LIST (DISTINCT)
      // ------------------------------
      const categoriesRows = await strapi.db.connection
        .select("category")
        .from("products")
        .distinct();

      const categories = ["all", ...categoriesRows.map((r) => r.category)];

      // ------------------------------
      // COMPANIES LIST (DISTINCT)
      // ------------------------------
      const companiesRows = await strapi.db.connection
        .select("company")
        .from("products")
        .distinct();

      const companies = ["all", ...companiesRows.map((r) => r.company)];

      // ------------------------------
      // META (exact format your frontend expects)
      // ------------------------------
      return {
        data: products,
        meta: {
          pagination: {
            page: pageNum,
            pageSize: sizeNum,
            pageCount: Math.ceil(total / sizeNum),
            total,
          },
          categories,
          companies,
        },
        params: ctx.query,
      };
    },
  })
);

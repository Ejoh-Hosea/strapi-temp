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
      const query: any = { where: {} };

      if (search) query.where.title = { $containsi: search };
      if (category && category !== "all") query.where.category = category;
      if (company && company !== "all") query.where.company = company;
      if (shipping === "true") query.where.shipping = true;
      if (price) {
        const max = Number(price);
        if (!isNaN(max)) query.where.price = { $lte: max };
      }

      // ------------------------------
      // SORTING
      // ------------------------------
      if (order === "a-z") query.orderBy = { title: "asc" };
      if (order === "z-a") query.orderBy = { title: "desc" };
      if (order === "high") query.orderBy = { price: "desc" };
      if (order === "low") query.orderBy = { price: "asc" };

      // ------------------------------
      // PAGINATION
      // ------------------------------
      const pageNum = Number(page) || 1;
      const sizeNum = Number(pageSize) || 10;
      query.skip = (pageNum - 1) * sizeNum;
      query.take = sizeNum;

      // ------------------------------
      // RUN PRODUCT QUERY (FILTER OUT DRAFTS)
      // ------------------------------
      const products = await strapi.db.query("api::product.product").findMany({
        ...query,
        where: {
          ...query.where,
          publishedAt: { $notNull: true }, // only published entries
        },
      });

      // ------------------------------
      // MAP PRODUCTS TO FRONTEND FORMAT
      // ------------------------------
      const data = products.map((p) => ({
        id: p.id,
        attributes: {
          title: p.title,
          company: p.company,
          description: p.description,
          featured: p.featured || false,
          category: p.category,
          image: p.image,
          price: p.price,
          shipping: p.shipping || false,
          colors: p.colors || [],
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          publishedAt: p.publishedAt || p.createdAt,
        },
      }));

      // ------------------------------
      // CATEGORIES & COMPANIES LIST
      // ------------------------------
      const categoriesRows = await strapi.db.connection
        .select("category")
        .from("products")
        .distinct();
      const categories = ["all", ...categoriesRows.map((r) => r.category)];

      const companiesRows = await strapi.db.connection
        .select("company")
        .from("products")
        .distinct();
      const companies = ["all", ...companiesRows.map((r) => r.company)];

      // ------------------------------
      // TOTAL COUNT FOR PAGINATION
      // ------------------------------
      const total = await strapi.db.query("api::product.product").count({
        where: { ...query.where, publishedAt: { $notNull: true } },
      });

      // ------------------------------
      // RETURN EXACT FRONTEND FORMAT
      // ------------------------------
      return {
        data,
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
      };
    },
  })
);

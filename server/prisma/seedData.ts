export const seedData = {
  "branches": [
    {
      "id": 1,
      "name": "E-Commerce - Principal",
      "address": "Jr. Amazonas 769, Chachapoyas 01001",
      "phone": "932107731",
      "isActive": true,
      "isMain": true,
      "igvExempt": true
    },
    {
      "id": 2,
      "name": "E-Commerce - Amazonas - 810",
      "address": "Jr. Amazonas 810, Chachapoyas 01001",
      "phone": "997527792",
      "isActive": true,
      "isMain": false,
      "igvExempt": true
    },
    {
      "id": 3,
      "name": "E-Commerce - Dos de Mayo - 558",
      "address": "Jr. Dos de Mayo 558, Chachapoyas 01001",
      "phone": "997005395",
      "isActive": true,
      "isMain": false,
      "igvExempt": true
    },
    {
      "id": 4,
      "name": "E-Commerce - Dos de Mayo - 551",
      "address": "Jr. Dos de Mayo 551, Chachapoyas 01001",
      "phone": "997867168",
      "isActive": true,
      "isMain": false,
      "igvExempt": true
    }
  ],
  "suppliers": [
    {
      "id": 1,
      "ruc": "20608765432",
      "razonSocial": "Distribuidora Intercontinental de Calzado S.A.C.",
      "contacto": "E-Commerce",
      "direccion": "Jr. Amazonas 456, Chachapoyas",
      "isActive": true
    }
  ],
  "brands": [
    {
      "id": 1,
      "name": "Nike",
      "logoUrl": "https://res.cloudinary.com/dugbrgwn8/image/upload/v1782491612/brands/Nike_1782491609852.png",
      "isActive": true
    }
  ],
  "categories": [
    {
      "id": 1,
      "name": "Calzado Deportivo",
      "parentId": null,
      "isActive": true,
      "imageUrl": "https://res.cloudinary.com/dugbrgwn8/image/upload/v1782671471/categories/Captura_de_pantalla_2026_06_28_133055_1782671468878.png",
      "sizeGuideUrl": null
    }
  ],
  "genders": [
    {
      "id": 1,
      "name": "Unisex",
      "isActive": true
    }
  ],
  "attributes": [
    {
      "id": 1,
      "name": "Color",
      "isVisualDriver": true,
      "isActive": true,
      "values": [
        {
          "id": 1,
          "value": "Negro",
          "isActive": true
        },
        {
          "id": 2,
          "value": "Blanco",
          "isActive": true
        }
      ]
    },
    {
      "id": 2,
      "name": "Talla",
      "isVisualDriver": false,
      "isActive": true,
      "values": [
        {
          "id": 3,
          "value": "40",
          "isActive": true
        },
        {
          "id": 4,
          "value": "42",
          "isActive": true
        }
      ]
    }
  ],
  "products": [
    {
      "id": 1,
      "code": "NIKEAF1",
      "name": "Zapatillas Nike ",
      "slug": "zapatillas-nike-air-force-1-07-nikeaf1",
      "description": "Las icónicas zapatillas Nike Air Force 1 '07 mantienen vivo su estilo legendario. Este modelo combina la comodidad clásica de la cancha de baloncesto con un diseño urbano impecable. Cuenta con una parte superior de cuero duradero, revestimientos cosidos para mayor sujeción, perforaciones en la puntera que mejoran la transpirabilidad y la famosa amortiguación Nike Air para brindar ligereza y confort durante todo el día.",
      "model": "Air Force 1 '07",
      "categoryId": 1,
      "brandId": 1,
      "genderId": 1,
      "isActive": true,
      "images": [
        {
          "id": 15,
          "url": "https://res.cloudinary.com/dugbrgwn8/image/upload/v1782659996/products/ChatGPT_Image_26_jun_2026__12_05_45_p_m__1782659994121.png",
          "isMain": true,
          "attributeValueId": null
        },
        {
          "id": 16,
          "url": "https://res.cloudinary.com/dugbrgwn8/image/upload/v1782660000/products/194500874831_2_20240126120000_mrtPeru_1782659996799.png",
          "isMain": false,
          "attributeValueId": null
        },
        {
          "id": 17,
          "url": "https://res.cloudinary.com/dugbrgwn8/image/upload/v1782660332/products/ChatGPT_Image_28_jun_2026__10_06_08_a_m__1782660309439.png",
          "isMain": false,
          "attributeValueId": 1
        },
        {
          "id": 18,
          "url": "https://res.cloudinary.com/dugbrgwn8/image/upload/v1782660336/products/ChatGPT_Image_28_jun_2026__10_03_11_a_m__1782660333809.png",
          "isMain": false,
          "attributeValueId": 1
        },
        {
          "id": 19,
          "url": "https://res.cloudinary.com/dugbrgwn8/image/upload/v1782660373/products/ChatGPT_Image_26_jun_2026__12_07_38_p_m__1782660369184.png",
          "isMain": false,
          "attributeValueId": 2
        },
        {
          "id": 20,
          "url": "https://res.cloudinary.com/dugbrgwn8/image/upload/v1782660376/products/ChatGPT_Image_26_jun_2026__12_05_45_p_m__1782660374567.png",
          "isMain": false,
          "attributeValueId": 2
        }
      ],
      "variants": [
        {
          "id": 1,
          "sku": "NIKEAF1-BLANCO-40",
          "price": "500",
          "costPrice": "300",
          "discountPercent": 25,
          "attributesJson": {
            "color": "Blanco",
            "talla": "40"
          },
          "isActive": true,
          "minStock": 5
        },
        {
          "id": 2,
          "sku": "NIKEAF1-NEGRO-42",
          "price": "500",
          "costPrice": "300",
          "discountPercent": 25,
          "attributesJson": {
            "color": "Negro",
            "talla": "42"
          },
          "isActive": true,
          "minStock": 5
        }
      ]
    }
  ],
  "banners": [
    {
      "id": 1,
      "imageUrl": "https://res.cloudinary.com/dugbrgwn8/image/upload/v1782714561/profiles/ChatGPT_Image_29_jun_2026__01_28_31_a_m__1782714557593.png",
      "linkUrl": "http://localhost:5173/products/zapatillas-nike-air-force-1-07-nikeaf1",
      "order": 0,
    }
  ],
  "systemSettings": [
    {
      "key": "MIN_STOCK_ALERT",
      "value": "5",
      "description": "Stock mínimo global para lanzar alertas por sucursal"
    },
    {
      "key": "PENDING_ORDER_TOLERANCE_HOURS",
      "value": "2",
      "description": "Horas de tolerancia para pedidos pagados sin procesar"
    },
    {
      "key": "ABANDONED_CART_HOURS",
      "value": "24",
      "description": "Horas para considerar un carrito como abandonado"
    },
    {
      "key": "BIRTHDAY_COUPON_DAYS",
      "value": "7",
      "description": "Días de vigencia del cupón de cumpleaños"
    }
  ]
};

export type StorePromotion = {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  unit: string;
  image: string;
  priceValue?: number | null;
  originalPriceValue?: number | null;
  discountValue?: number | null;
};

export type StoreInfoBlock = {
  label: string;
  value: string;
};

export type Store = {
  id: string;
  name: string;
  description: string;
  category: string;
  distance: string;
  deliveryTime: string;
  rating: number;
  isOpen: boolean;
  promotion?: string;
  brandColor: string;
  city: string;
  state: string;
  bannerImage: string;
  logo: string;
  about: string;
  info: StoreInfoBlock[];
  workingHours: StoreInfoBlock[];
  promotions: StorePromotion[];
};

export const MOCKED_STORES: Store[] = [
  {
    id: "1",
    name: "Super Kuachack",
    description: "Entrega expressa e ofertas especiais toda semana.",
    category: "Mercado",
    distance: "1,4 km",
    deliveryTime: "30 - 45 min",
    rating: 4.6,
    isOpen: true,
    promotion: "Entrega gratis a partir de R$ 60",
    brandColor: "#FEE9EA",
    city: "Ijui",
    state: "RS",
    bannerImage:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    logo:
      "https://raw.githubusercontent.com/cesarwillemberg/assets/main/stores/kuchack-logo.png",
    about:
      "O Super Kuachack oferece uma experiência de compra completa, com foco em praticidade e variedade. Nossa equipe está sempre pronta para auxiliar, garantindo que você encontre tudo o que precisa para o dia a dia.",
    info: [
      {
        label: "Endereço",
        value: "Rua das Palmeiras, 500, Centro, Ijui - RS",
      },
      {
        label: "Contato",
        value: "(55) 3200-1234",
      },
    ],
    workingHours: [
      { label: "Seg a Qui", value: "07:00 às 21:30" },
      { label: "Sex e Sáb", value: "07:00 às 22:00" },
      { label: "Dom e Feriados", value: "07:00 às 21:00" },
    ],
    promotions: [
      {
        id: "promo-1-1",
        name: "Arroz branco Camil 1 Kg",
        price: "R$ 20,00",
        originalPrice: "R$ 23,90",
        unit: "un",
        image:
          "https://raw.githubusercontent.com/cesarwillemberg/assets/main/stores/products/arroz-camil.png",
      },
      {
        id: "promo-1-2",
        name: "Feijão Carioca Camil 1 Kg",
        price: "R$ 18,00",
        originalPrice: "R$ 20,00",
        unit: "un",
        image:
          "https://raw.githubusercontent.com/cesarwillemberg/assets/main/stores/products/feijao-camil.png",
      },
      {
        id: "promo-1-3",
        name: "Carne bovina Maminha",
        price: "R$ 30,00",
        originalPrice: "R$ 38,90",
        unit: "kg",
        image:
          "https://raw.githubusercontent.com/cesarwillemberg/assets/main/stores/products/maminha.png",
      },
    ],
  },
  {
    id: "2",
    name: "UFFA Mercado",
    description: "Amplo mix de produtos com retirada rapida.",
    category: "Mercado",
    distance: "2,4 km",
    deliveryTime: "40 - 55 min",
    rating: 4.3,
    isOpen: true,
    promotion: "Cupom de R$ 30 disponivel",
    brandColor: "#FFEAEA",
    city: "Ijui",
    state: "RS",
    bannerImage:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
    logo:
      "https://raw.githubusercontent.com/cesarwillemberg/assets/main/stores/uffa-logo.png",
    about:
      "O UFFA Mercado nasceu com a ideia de tornar as compras semanais mais rápidas e acessíveis. Trabalhamos com fornecedores locais para garantir frescor e qualidade em cada produto.",
    info: [
      {
        label: "Endereço",
        value: "Rua XV de Novembro, 210, Bairro Modelo, Ijui - RS",
      },
      {
        label: "Contato",
        value: "(55) 3300-4040",
      },
    ],
    workingHours: [
      { label: "Seg a Sáb", value: "08:00 às 21:00" },
      { label: "Dom e Feriados", value: "08:00 às 18:00" },
    ],
    promotions: [
      {
        id: "promo-2-1",
        name: "Leite Integral 1 L",
        price: "R$ 5,49",
        originalPrice: "R$ 6,20",
        unit: "un",
        image:
          "https://raw.githubusercontent.com/cesarwillemberg/assets/main/stores/products/leite.png",
      },
      {
        id: "promo-2-2",
        name: "Biscoito Recheado 120 g",
        price: "R$ 2,99",
        unit: "un",
        image:
          "https://raw.githubusercontent.com/cesarwillemberg/assets/main/stores/products/biscoito.png",
      },
    ],
  },
  {
    id: "3",
    name: "CotriPal Cooperativa",
    description: "Produtos selecionados direto dos cooperados.",
    category: "Cooperativa",
    distance: "3,2 km",
    deliveryTime: "45 - 60 min",
    rating: 3.8,
    isOpen: true,
    promotion: "Cupom de R$ 50 disponivel",
    brandColor: "#E9F6FF",
    city: "Ijui",
    state: "RS",
    bannerImage:
      "https://images.unsplash.com/photo-1600891965059-4bb018520ef5?auto=format&fit=crop&w=1200&q=80",
    logo:
      "https://raw.githubusercontent.com/cesarwillemberg/assets/main/stores/cotripal-logo.png",
    about:
      "A CotriPal reúne produtores locais para entregar alimentos frescos e de origem controlada. Nosso compromisso é fortalecer o campo e levar qualidade às mesas da cidade.",
    info: [
      {
        label: "Endereço",
        value: "Av. 21 de Abril, 800, Zona Rural, Ijui - RS",
      },
      {
        label: "Contato",
        value: "(55) 3250-5050",
      },
    ],
    workingHours: [
      { label: "Seg a Sex", value: "07:30 às 18:00" },
      { label: "Sábado", value: "07:30 às 12:30" },
    ],
    promotions: [
      {
        id: "promo-3-1",
        name: "Queijo Prato 500 g",
        price: "R$ 32,00",
        originalPrice: "R$ 38,00",
        unit: "kg",
        image:
          "https://raw.githubusercontent.com/cesarwillemberg/assets/main/stores/products/queijo.png",
      },
    ],
  },
  {
    id: "4",
    name: "Atakadao Kuachack",
    description: "Especialista em atacado com ofertas para o dia a dia.",
    category: "Atacado",
    distance: "3,9 km",
    deliveryTime: "50 - 70 min",
    rating: 4.1,
    isOpen: false,
    promotion: "Agende pedidos para amanha",
    brandColor: "#FFF3E9",
    city: "Santa Maria",
    state: "RS",
    bannerImage:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
    logo:
      "https://raw.githubusercontent.com/cesarwillemberg/assets/main/stores/atakadao-logo.png",
    about:
      "O Atakadao Kuachack combina preços competitivos com variedades em grandes volumes. Ideal para quem busca abastecer o negócio ou a despensa da família.",
    info: [
      {
        label: "Endereço",
        value: "Rodovia BR-158, Km 15, Santa Maria - RS",
      },
      {
        label: "Contato",
        value: "(55) 3600-7070",
      },
    ],
    workingHours: [
      { label: "Seg a Sex", value: "06:30 às 20:30" },
      { label: "Sábado", value: "06:30 às 20:30" },
      { label: "Dom e Feriados", value: "Fechado" },
    ],
    promotions: [
      {
        id: "promo-4-1",
        name: "Óleo de Soja 900 ml (cx c/ 12)",
        price: "R$ 75,00",
        unit: "cx",
        image:
          "https://raw.githubusercontent.com/cesarwillemberg/assets/main/stores/products/oleo-soja.png",
      },
      {
        id: "promo-4-2",
        name: "Açúcar Refinado 5 Kg",
        price: "R$ 24,90",
        unit: "pc",
        image:
          "https://raw.githubusercontent.com/cesarwillemberg/assets/main/stores/products/acucar.png",
      },
    ],
  },
];

export const DEFAULT_FILTERS = {
  state: "RS",
  city: "Ijui",
  radiusKm: 5,
} as const;

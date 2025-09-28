import CarrouselOnboarding from "@/src/components/no-auth/onboarding/CarrouselOnboarding";
import React from "react";
import { View } from "react-native";

import FavoriteItem from "@/src/assets/images/onboarding/undraw_favourite-item_kv86.svg";
import OnTheWay from "@/src/assets/images/onboarding/undraw_on-the-way_ahi2.svg";
import ShoppingApp from "@/src/assets/images/onboarding/undraw_shopping-app_b80f.svg";
import WalletDiag from "@/src/assets/images/onboarding/undraw_wallet_diag.svg";

const slides = [
  {
    id: "1",
    title: "Bem-vindo ao iMarket",
    description:
      "Tudo o que você precisa em um só lugar, direto no seu celular.",
    svg: ShoppingApp,
  },
  {
    id: "2",
    title: "Todos os seus produtos favoritos",
    description:
      "Milhares de mercados, padarias e supermercados ao seu alcance.",
    svg: FavoriteItem,
  },
  {
    id: "3",
    title: "Ofertas exclusivas",
    description:
      "Aproveite promoções e cupons projetados para economizar dinheiro.",
    svg: WalletDiag,
  },
  {
    id: "4",
    title: "Entrega rápida e segura",
    description: "Suas compras frescas direto na sua porta.",
    svg: OnTheWay,
  },
];

export default function Onboarding() {
  return (
    <View style={{ flex: 1 }}>
      <CarrouselOnboarding data={slides} />
    </View>
  );
}

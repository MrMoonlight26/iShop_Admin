"use client";

import * as React from "react";
import {
  IconDashboard,
  IconBuildingStore,
  IconShoppingCart,
  IconChartBar,
  IconSettings,
  IconHelp,
  IconUsers,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Admin User",
    email: "admin@cornershop.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Vendors Management",
      url: "/admin/users",
      icon: IconUsers,
    },
    {
      title: "Shop Management",
      url: "/admin/shops",
      icon: IconBuildingStore,
    },
    {
      title: "Catalog Management",
      url: "#",
      icon: IconShoppingCart,
      items: [
        {
          title: "Unit Types Management",
          url: "/admin/units",
        },
        {
          title: "Unit Classes",
          url: "/admin/units/classes",
        },
        {
          title: "Categories",
          url: "/admin/categories",
        },
            {
              title: "Brands",
              url: "/admin/brands",
            },
        {
          title: "Business Categories",
          url: "/admin/business-categories",
        },
        {
          title: "Products",
          url: "/admin/catalog",
        },
      ],
    },
    {
      title: "Orders Management",
      url: "#",
      icon: IconShoppingCart,
      items: [
        {
          title: "Orders",
          url: "/admin/orders",
        },
        {
          title: "Returns",
          url: "#",
        },
      ],
    },
    {
      title: "Payment Config",
      url: "/admin/payment-configs",
      icon: IconSettings,
    },
    {
      title: "Notification Templates",
      url: "/admin/templates",
      icon: IconSettings,
    },
    {
      title: "Analytics",
      url: "#",
      icon: IconChartBar,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/admin/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <div className="flex items-center justify-center w-5 h-5 rounded bg-primary text-primary-foreground font-bold text-sm">
                  CS
                </div>
                <span className="text-base font-semibold">
                  The CornerShop
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}

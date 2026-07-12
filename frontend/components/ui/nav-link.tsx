"use client";

import { Link } from "@heroui/react";
import NextLink from "next/link";
import type { ComponentProps } from "react";

type NavLinkProps = Omit<ComponentProps<typeof Link>, "render">;

export function NavLink({ href, children, ...props }: NavLinkProps) {
  return (
    <Link
      {...props}
      href={href}
      render={(linkProps) => (
        <NextLink
          {...(linkProps as ComponentProps<typeof NextLink>)}
          href={href as string}
        />
      )}
    >
      {children}
    </Link>
  );
}

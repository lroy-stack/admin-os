import { LocaleBundles } from "@/app/_components/locale-root";
import { pageMetadata } from "@/config/metadata.server";

import { rolesBundle, rolesMessages } from "./_components/messages.server";
import { Roles } from "./_components/roles";
import { roles } from "./_components/roles-table/data";

export const generateMetadata = () => pageMetadata("/dashboard/roles", rolesMessages);

export default function Page() {
  return (
    <LocaleBundles bundles={[rolesBundle]}>
      <Roles roles={roles} />
    </LocaleBundles>
  );
}

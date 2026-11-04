import { describeAdapterContract } from "@/config/adapter-contract.testkit";

import { durableAdapterFor } from "./support";

describeAdapterContract("durable", durableAdapterFor);

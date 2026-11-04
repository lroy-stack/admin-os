import { describeAdapterContract } from "@/config/adapter-contract.testkit";

import { durableAdapterFor } from "./support";
import { abortAllDurableObjects } from "cloudflare:test";

describeAdapterContract("durable", durableAdapterFor, abortAllDurableObjects);

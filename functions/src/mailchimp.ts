import * as functions from "firebase-functions";

import md5 from "md5";

// eslint-disable-next-line
const mailchimp = require("@mailchimp/mailchimp_marketing");

mailchimp.setConfig({
  apiKey: functions.config().mailchimp.apikey,
  server: "us6",
});

const LIST_ID = functions.config().mailchimp.list;
const TAG_NAME = "test";

export const addTransitionTagToMembers = async (): Promise<void> => {
  interface Member {
    tags: {
      id: number;
      name: string;
    }[];
    email_address: string;
    stats?: { ecommerce_data?: { total_revenue: number } };
  }

  const response = await mailchimp.lists.getListMembersInfo(LIST_ID, {
    fields: [
      "members.email_address",
      "members.tags",
      "members.stats",
      "members.status",
    ],
    count: 2000,
  });

  const filtered = response.members
  .filter((m: Member) => {
    return (
      m.tags == undefined || m.tags.map((t: any) => t.name).indexOf(TAG_NAME) === -1
    );
  });

  const sorted = filtered.sort((a: Member, b: Member) => {
    if (!b.stats || !b.stats.ecommerce_data) {
      return 0;
    }
    if (!a.stats || !a.stats.ecommerce_data) {
      return 1;
    }

    return (
      b.stats.ecommerce_data.total_revenue -
      a.stats.ecommerce_data.total_revenue
    );
  });

  const sliced = sorted.slice(0, 10);

  await Promise.all(
    sliced.map(async (m: Member) => {
      console.log(`Adding ${TAG_NAME} to ${m.email_address}`)
      return mailchimp.lists.updateListMemberTags(
        LIST_ID,
        md5(m.email_address.toLowerCase()),
        { tags: [{ name: TAG_NAME, status: "active" }] },
      );
    }),
  );
};

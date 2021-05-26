import * as functions from "firebase-functions";

import { addTransitionTagToMembers } from "./mailchimp";

const generic = async (
  f: () => Promise<void>,
  resp: functions.Response<any>,
): Promise<void> => {
  return f()
    .then(() => {
      resp.status(200).end();
    })
    .catch((error) => {
      console.error(error);
      resp.status(500).end();
    });
};

exports.addTransitionTagToMembers = functions.https.onRequest(
  async (request, resp) => await generic(addTransitionTagToMembers, resp),
);

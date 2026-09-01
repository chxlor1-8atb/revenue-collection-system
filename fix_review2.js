const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/review/ReviewClient.tsx', 'utf8');

let target1 = 'try {\n      const { getPusherClient } = require("@/lib/pusher");\n      pusherClient = getPusherClient();\n    } catch (e) {\n      console.warn("Pusher not loaded in ReviewClient", e);\n    }\n\n    if (pusherClient) {';
let replace1 = 'const setupPusher = async () => {\n      try {\n        const { getPusherClient } = await import("@/lib/pusher");\n        pusherClient = await getPusherClient();\n      } catch (e) {\n        console.warn("Pusher not loaded in ReviewClient", e);\n      }\n\n      if (pusherClient) {';
code = code.replace(target1, replace1);

let target2 = "channel.bind('slip-processed', handleSlipProcessed);\n    }\n\n    return () => {\n      if (pusherClient) {\n        pusherClient.unsubscribe('admin-notifications');\n      }\n    };\n  }, [mutate]);";
let replace2 = "channel.bind('slip-processed', handleSlipProcessed);\n      }\n    };\n    setupPusher();\n\n    return () => {\n      if (pusherClient) {\n        pusherClient.unsubscribe('admin-notifications');\n      }\n    };\n  }, [mutate]);";
code = code.replace(target2, replace2);

fs.writeFileSync('src/app/dashboard/review/ReviewClient.tsx', code);

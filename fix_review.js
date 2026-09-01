const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/review/ReviewClient.tsx', 'utf8');

const target =       channel.bind('new-slip', refreshQueue); // Usually needs full object, so we just fetch fast
      channel.bind('new-qr', handleNewQr);
      channel.bind('slip-processed', handleSlipProcessed);

      return () => {
        channel.unbind('new-slip', refreshQueue);
        channel.unbind('new-qr', handleNewQr);
        channel.unbind('slip-processed', handleSlipProcessed);
        pusherClient.unsubscribe('admin-notifications');
      };
    };
    setupPusher();
  }, [mutate]);;

const replacement =       channel.bind('new-slip', refreshQueue); // Usually needs full object, so we just fetch fast
      channel.bind('new-qr', handleNewQr);
      channel.bind('slip-processed', handleSlipProcessed);
    }
    };
    setupPusher();

    return () => {
      if (pusherClient) {
        pusherClient.unsubscribe('admin-notifications');
      }
    };
  }, [mutate]);;

fs.writeFileSync('src/app/dashboard/review/ReviewClient.tsx', code.replace(target, replacement));

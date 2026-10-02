#import "SafariExtensionStateShim.h"

@implementation SFSafariExtensionManager (ScrollmarkShim)

+ (void)scrollmark_getStateOfSafariExtensionWithIdentifier:(NSString *)identifier
    completionHandler:
        (void (^)(SFSafariExtensionState *_Nullable state,
                  NSError *_Nullable error))completionHandler {
  [self getStateOfSafariExtensionWithIdentifier:identifier completionHandler:completionHandler];
}

@end

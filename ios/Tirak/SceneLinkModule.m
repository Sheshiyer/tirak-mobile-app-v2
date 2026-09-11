#import "SceneLinkModule.h"

#import <React/RCTBridgeModule.h>

@interface TirakSceneLinkRegistry () <RCTBridgeModule>
@end

@implementation TirakSceneLinkRegistry

static NSString *_pendingLinkID;
static NSString *_pendingLinkURL;
static NSString *_pendingLinkKind;

RCT_EXPORT_MODULE(TirakSceneLink)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

+ (void)preserveURL:(NSURL *)url kind:(NSString *)kind
{
  NSAssert([NSThread isMainThread], @"Scene links must be preserved on the main thread.");

  // The first scene connection owns the launch. A second callback cannot
  // replace an unacknowledged link and silently lose its intended route.
  if (_pendingLinkID != nil) {
    return;
  }

  _pendingLinkID = NSUUID.UUID.UUIDString;
  _pendingLinkURL = url.absoluteString;
  _pendingLinkKind = [kind copy];
}

RCT_REMAP_METHOD(getPendingLink,
                 getPendingLinkWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(__unused RCTPromiseRejectBlock)reject)
{
  if (_pendingLinkID == nil || _pendingLinkURL == nil || _pendingLinkKind == nil) {
    resolve([NSNull null]);
    return;
  }

  resolve(@{
    @"id" : _pendingLinkID,
    @"url" : _pendingLinkURL,
    @"kind" : _pendingLinkKind,
  });
}

RCT_REMAP_METHOD(acknowledgePendingLink,
                 acknowledgePendingLink:(NSString *)pendingLinkID
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(__unused RCTPromiseRejectBlock)reject)
{
  if (_pendingLinkID == nil || ![_pendingLinkID isEqualToString:pendingLinkID]) {
    resolve(@NO);
    return;
  }

  NSLog(@"[TirakSceneLinkJS] consumed cold %@", _pendingLinkKind);
  _pendingLinkID = nil;
  _pendingLinkURL = nil;
  _pendingLinkKind = nil;
  resolve(@YES);
}

RCT_REMAP_METHOD(acknowledgeWarmLink,
                 acknowledgeWarmLink:(NSString *)linkURL
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(__unused RCTPromiseRejectBlock)reject)
{
  NSURL *url = [NSURL URLWithString:linkURL];
  NSString *scheme = url.scheme.lowercaseString;
  NSString *kind = [scheme isEqualToString:@"http"] || [scheme isEqualToString:@"https"]
    ? @"universal-link"
    : @"custom-scheme";
  NSLog(@"[TirakSceneLinkJS] consumed warm %@", kind);
  resolve(nil);
}

@end

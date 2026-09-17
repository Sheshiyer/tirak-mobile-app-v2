#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface TirakSceneLinkRegistry : NSObject

+ (void)preserveURL:(NSURL *)url kind:(NSString *)kind;

@end

NS_ASSUME_NONNULL_END

import React from 'react';
const Renderer=require('react-test-renderer');const {act}=Renderer;
jest.mock('react-native',()=>({TouchableOpacity:'TouchableOpacity',Text:'Text',ActivityIndicator:'ActivityIndicator',View:'View',Platform:{OS:'web',select:(x:any)=>x.web??x.default},StyleSheet:{create:(x:any)=>x},useWindowDimensions:()=>({width:300,height:699,fontScale:1.4})}));
jest.mock('expo-linear-gradient',()=>({LinearGradient:'LinearGradient'}));
jest.mock('react-native-reanimated',()=>({__esModule:true,default:{View:'AnimatedView'},useSharedValue:(value:any)=>({value}),useAnimatedStyle:(callback:any)=>callback(),withSpring:(value:any)=>value}));
jest.mock('expo-haptics',()=>({impactAsync:jest.fn(),ImpactFeedbackStyle:{Light:'Light'}}));
import {Button} from '../components/ui/Button';
const flatten=(value:any):any=>Array.isArray(value)?Object.assign({},...value.filter(Boolean).map(flatten)):value||{};
it.each(['primary','coral'] as const)('%s puts padding inside full gradient and allows bounded two-line label',async variant=>{
 let tree:any;await act(async()=>{tree=Renderer.create(<Button variant={variant} title="Continue to your profile — verify later" fullWidth/>);});
 const touch=tree.root.findByType('TouchableOpacity'),gradient=tree.root.findByType('LinearGradient'),text=tree.root.findByType('Text');
 const outer=flatten(touch.props.style),inner=flatten(gradient.props.style),label=flatten(text.props.style);
 expect(outer.paddingHorizontal).toBe(0);expect(inner.paddingHorizontal).toBeGreaterThan(0);expect(inner.width).toBe('100%');
 expect(text.props.numberOfLines).toBe(2);expect(text.props.adjustsFontSizeToFit).toBe(false);expect(label.flexShrink).toBe(1);expect(label.maxWidth).toBe('100%');expect(outer.minHeight).toBeGreaterThanOrEqual(44);
 expect(touch.props.accessibilityLabel).toBe('Continue to your profile — verify later');await act(async()=>tree.unmount());
});
it('retains loading accessibility and disabled interaction without stale label',async()=>{
 let tree:any;await act(async()=>{tree=Renderer.create(<Button title="Save changes" loading/>);});
 const button=tree.root.findByType('TouchableOpacity');expect(button.props.disabled).toBe(true);expect(button.props.accessibilityState).toEqual(expect.objectContaining({busy:true,disabled:true}));expect(tree.root.findAllByType('ActivityIndicator')).toHaveLength(1);await act(async()=>tree.unmount());
});

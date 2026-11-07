import React from 'react';
import {render,fireEvent,act} from '@testing-library/react-native';
import {AccountClosureConfirmation} from '../components/AccountClosureConfirmation';
it('keeps the account without calling the close API',()=>{
 const onClose=jest.fn(),onConfirm=jest.fn();
 const ui=render(<AccountClosureConfirmation visible onClose={onClose} onConfirm={onConfirm}/>);
 fireEvent.press(ui.getByRole('button',{name:'Keep account'}));
 expect(onClose).toHaveBeenCalledTimes(1);expect(onConfirm).not.toHaveBeenCalled();ui.unmount();
});
it('waits for explicit confirmation, blocks duplicate calls and dismissal while pending, then closes',async()=>{
 let finish!:()=>void;const onConfirm=jest.fn(()=>new Promise<void>(resolve=>{finish=resolve;}));const onClose=jest.fn();
 const ui=render(<AccountClosureConfirmation visible onClose={onClose} onConfirm={onConfirm}/>);
 expect(onConfirm).not.toHaveBeenCalled();
 const button=ui.getByRole('button',{name:'Confirm close account'});
 let control=button;while(typeof control.props.onPress!=='function'&&control.parent)control=control.parent;
 const press=control.props.onPress;act(()=>{press();press();});
 expect(onConfirm).toHaveBeenCalledTimes(1);
 expect(ui.getByRole('button',{name:'Confirm close account',disabled:true})).toBeTruthy();
 fireEvent.press(ui.getByRole('button',{name:'Keep account',disabled:true}));expect(onClose).not.toHaveBeenCalled();
 await act(async()=>finish());expect(onClose).toHaveBeenCalledTimes(1);ui.unmount();
});
it('keeps failure visible and allows a deliberate retry',async()=>{
 const onConfirm=jest.fn().mockRejectedValueOnce(new Error('Service unavailable. Try again.')).mockResolvedValueOnce(undefined);const onClose=jest.fn();
 const ui=render(<AccountClosureConfirmation visible onClose={onClose} onConfirm={onConfirm}/>);
 await act(async()=>fireEvent.press(ui.getByRole('button',{name:'Confirm close account'})));
 expect(ui.getByRole('alert').props.children).toBe('Service unavailable. Try again.');expect(onClose).not.toHaveBeenCalled();
 await act(async()=>fireEvent.press(ui.getByRole('button',{name:'Confirm close account'})));
 expect(onConfirm).toHaveBeenCalledTimes(2);expect(onClose).toHaveBeenCalledTimes(1);ui.unmount();
});
